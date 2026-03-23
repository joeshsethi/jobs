#!/usr/bin/env python3
"""
Direct careers page scraper for priority companies.
Checks each company's careers/jobs page for SE/SA roles.

Usage:
    python scripts/scrape_careers.py
    python scripts/scrape_careers.py --company Anthropic
"""

import argparse
import json
import re
import time
import urllib.request
from dataclasses import dataclass, asdict
from typing import Optional

ROLE_KEYWORDS = [
    "solutions engineer", "sales engineer", "solutions architect",
    "solutions consultant", "pre-sales", "technical account manager",
    "customer engineer", "field engineer", "sales development",
    "sdr", "demo engineer",
]

EXCLUDE_TITLES = [
    "software engineer", "backend developer", "frontend developer",
    "data scientist", "ml researcher", "product manager",
]

# Direct career page URLs to check
CAREER_PAGES = {
    # AI Companies
    "Anthropic": "https://boards-api.greenhouse.io/v1/boards/anthropic/jobs",
    "OpenAI": "https://api.ashbyhq.com/posting-api/job-board/openai",
    "Cohere": "https://boards-api.greenhouse.io/v1/boards/cohere/jobs",

    # Cloud & Data
    "Snowflake": "https://boards-api.greenhouse.io/v1/boards/snowflake/jobs",
    "Databricks": "https://boards-api.greenhouse.io/v1/boards/databricks/jobs",
    "MongoDB": "https://boards-api.greenhouse.io/v1/boards/mongodb/jobs",
    "Datadog": "https://boards-api.greenhouse.io/v1/boards/datadog/jobs",

    # SaaS
    "Atlassian": "https://boards-api.greenhouse.io/v1/boards/atlassian/jobs",
    "Monday.com": "https://boards-api.greenhouse.io/v1/boards/mondaydotcom/jobs",
    "Rippling": "https://boards-api.greenhouse.io/v1/boards/rippling/jobs",
    "Synthesia": "https://boards-api.greenhouse.io/v1/boards/synthesia/jobs",
    "Seismic": "https://boards-api.greenhouse.io/v1/boards/seismic/jobs",
    "Navan": "https://boards-api.greenhouse.io/v1/boards/navan/jobs",
    "Benchling": "https://boards-api.greenhouse.io/v1/boards/benchling/jobs",

    # Sports Tech
    "Sportradar": "https://boards-api.greenhouse.io/v1/boards/sportradar/jobs",
    "DraftKings": "https://boards-api.greenhouse.io/v1/boards/draftkings/jobs",
    "FanDuel": "https://boards-api.greenhouse.io/v1/boards/fanduel/jobs",
    "Whoop": "https://boards-api.greenhouse.io/v1/boards/whoop/jobs",
    "Hudl": "https://boards-api.greenhouse.io/v1/boards/hudl/jobs",
    "Catapult": "https://boards-api.greenhouse.io/v1/boards/catapultsports/jobs",
    "Genius Sports": "https://boards-api.greenhouse.io/v1/boards/geniussports/jobs",
    "Stats Perform": "https://boards-api.greenhouse.io/v1/boards/statsperform/jobs",
}

SPORTS_TECH = [
    "Sportradar", "Stats Perform", "Genius Sports", "Second Spectrum",
    "Catapult", "Hudl", "Whoop", "DraftKings", "FanDuel",
    "Underdog Fantasy", "PrizePicks", "NBA",
]


@dataclass
class JobListing:
    title: str
    company: str
    location: str = ""
    url: str = ""
    source: str = ""
    description: str = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    posted_date: str = ""
    role_type: str = ""
    is_remote: bool = False
    is_sports_tech: bool = False
    has_apac_exposure: bool = False
    requires_demos: bool = False


def is_relevant(title: str) -> bool:
    title_lower = title.lower()
    for ex in EXCLUDE_TITLES:
        if ex in title_lower:
            return False
    return any(kw in title_lower for kw in ROLE_KEYWORDS)


def fetch(url: str) -> Optional[str]:
    try:
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0 (compatible; JobBot/1.0)")
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        return None


def scrape_greenhouse_api(company: str, url: str) -> list[JobListing]:
    jobs = []
    content = fetch(url)
    if not content:
        return jobs
    try:
        data = json.loads(content)
        for posting in data.get("jobs", []):
            title = posting.get("title", "")
            if is_relevant(title):
                loc = posting.get("location", {}).get("name", "")
                text = f"{title} {loc}".lower()
                jobs.append(JobListing(
                    title=title,
                    company=company,
                    location=loc,
                    url=posting.get("absolute_url", ""),
                    source=f"Careers ({company})",
                    is_remote="remote" in text,
                    is_sports_tech=company in SPORTS_TECH,
                    has_apac_exposure="japan" in text or "apac" in text,
                    requires_demos="demo" in text or "client-facing" in text,
                ))
    except (json.JSONDecodeError, KeyError):
        pass
    return jobs


def scrape_ashby_api(company: str, url: str) -> list[JobListing]:
    jobs = []
    content = fetch(url)
    if not content:
        return jobs
    try:
        data = json.loads(content)
        for posting in data.get("jobs", []):
            title = posting.get("title", "")
            if is_relevant(title):
                loc = posting.get("location", "")
                text = f"{title} {loc}".lower()
                jobs.append(JobListing(
                    title=title,
                    company=company,
                    location=loc if isinstance(loc, str) else "",
                    url=posting.get("jobUrl", ""),
                    source=f"Careers ({company})",
                    is_remote="remote" in text,
                    is_sports_tech=company in SPORTS_TECH,
                    has_apac_exposure="japan" in text or "apac" in text,
                ))
    except (json.JSONDecodeError, KeyError):
        pass
    return jobs


def main():
    parser = argparse.ArgumentParser(description="Scrape careers pages for SE/SA roles")
    parser.add_argument("--company", help="Scrape a specific company")
    parser.add_argument("--output", default="careers_output.json", help="Output file")
    args = parser.parse_args()

    all_jobs: list[JobListing] = []
    targets = CAREER_PAGES

    if args.company:
        targets = {k: v for k, v in CAREER_PAGES.items() if k.lower() == args.company.lower()}
        if not targets:
            print(f"Company '{args.company}' not found in career pages list.")
            return

    print(f"\n🏢 Career Page Scraper — Checking {len(targets)} companies\n")

    for company, url in targets.items():
        if "ashby" in url:
            jobs = scrape_ashby_api(company, url)
        else:
            jobs = scrape_greenhouse_api(company, url)

        all_jobs.extend(jobs)
        status = f"✅ {len(jobs)} roles" if jobs else "—  no matches"
        print(f"  {company:20s} {status}")
        time.sleep(0.5)

    print(f"\n{'=' * 50}")
    print(f"Total relevant roles found: {len(all_jobs)}")

    if all_jobs:
        with open(args.output, "w") as f:
            json.dump([asdict(j) for j in all_jobs], f, indent=2)
        print(f"Saved to {args.output}")

        # Try sending to app
        try:
            payload = json.dumps({"jobs": [asdict(j) for j in all_jobs]}).encode()
            req = urllib.request.Request(
                "http://localhost:3000/api/jobs/search",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="PUT",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode())
                print(f"\nSent to app: {result.get('matched', 0)} scored and stored")
        except Exception:
            print("\n[i] App not running — use the JSON file to import later")

    print()


if __name__ == "__main__":
    main()
