#!/usr/bin/env python3
"""
Job Scraper for Joesh Sethi's SE/SA Job Search
Scrapes jobs from multiple sources and sends them to the web app for scoring.

Usage:
    python scripts/scrape_jobs.py                    # Run all scrapers
    python scripts/scrape_jobs.py --source indeed     # Run specific source
    python scripts/scrape_jobs.py --source greenhouse  # Greenhouse boards
    python scripts/scrape_jobs.py --source careers     # Direct career pages
"""

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from typing import Optional

# ============================================================
# PROFILE CONFIG — mirrors src/lib/profile.ts
# ============================================================

ROLE_KEYWORDS = [
    "solutions engineer", "sales engineer", "solutions architect",
    "solutions consultant", "pre-sales engineer", "pre sales engineer",
    "technical account manager", "associate solutions engineer",
    "sales development representative", "customer engineer",
    "field engineer", "demo engineer",
]

EXCLUDE_TITLES = [
    "software engineer", "backend developer", "frontend developer",
    "data scientist", "ml researcher", "product manager",
    "staff engineer", "principal engineer",
]

LOCATIONS = ["New York", "NYC", "Los Angeles", "LA", "Philadelphia", "Remote"]

TARGET_COMPANIES = [
    "Anthropic", "OpenAI", "Cohere", "AWS", "Amazon Web Services",
    "Google Cloud", "Salesforce", "Snowflake", "Databricks",
    "Monday.com", "Atlassian", "Warp", "Synthesia", "Rippling",
    "Box", "Boomi", "MongoDB", "Navan", "Datadog", "Dynatrace",
    "Seismic", "Astronomer", "Benchling", "New Era Technology",
    "Sportradar", "Stats Perform", "Genius Sports", "Second Spectrum",
    "Catapult", "Hudl", "Whoop", "DraftKings", "FanDuel",
    "Underdog Fantasy", "PrizePicks", "NBA",
]

SPORTS_TECH_COMPANIES = [
    "Sportradar", "Stats Perform", "Genius Sports", "Second Spectrum",
    "Catapult", "Hudl", "PlayMetrics", "Zelus Analytics", "Whoop",
    "Strivr", "HomeCourt", "ShotTracker", "Pixellot", "Tempus Ex",
    "DraftKings", "FanDuel", "Underdog Fantasy", "PrizePicks",
    "Sporta Japan", "Trackman", "Hawk-Eye", "ChyronHego", "WSC Sports",
    "Veo", "PlayerMaker", "Kinexon", "Rapsodo", "NBA",
]

# Greenhouse board slugs for target companies
GREENHOUSE_BOARDS = {
    "Anthropic": "anthropic",
    "Rippling": "rippling",
    "MongoDB": "mongodb",
    "Datadog": "datadog",
    "Benchling": "benchling",
    "Astronomer": "astronomer",
    "Navan": "navan",
    "Warp": "warp",
    "Synthesia": "synthesia",
    "Seismic": "seismic",
    "DraftKings": "draftkings",
    "FanDuel": "fanduel",
    "Sportradar": "sportradar",
    "Whoop": "whoop",
    "Hudl": "hudl",
    "PrizePicks": "prizepicks",
}

# Lever company slugs
LEVER_BOARDS = {
    "Box": "box",
    "Boomi": "boomi",
}

# Ashby company slugs
ASHBY_BOARDS = {
    "OpenAI": "openai",
}

APP_URL = "http://localhost:3000"


@dataclass
class JobListing:
    title: str
    company: str
    location: str = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: str = ""
    url: str = ""
    source: str = ""
    posted_date: str = ""
    role_type: str = ""
    is_remote: bool = False
    is_sports_tech: bool = False
    has_apac_exposure: bool = False
    requires_demos: bool = False


def is_relevant_title(title: str) -> bool:
    """Check if job title matches our target roles."""
    title_lower = title.lower()
    for exclude in EXCLUDE_TITLES:
        if exclude in title_lower:
            return False
    for keyword in ROLE_KEYWORDS:
        if keyword in title_lower:
            return True
    return False


def detect_flags(job: JobListing) -> JobListing:
    """Detect special flags from job details."""
    text = f"{job.title} {job.description} {job.location}".lower()

    job.is_remote = "remote" in text
    job.is_sports_tech = any(c.lower() in job.company.lower() for c in SPORTS_TECH_COMPANIES)
    job.has_apac_exposure = any(kw in text for kw in ["japan", "apac", "asia pacific", "japanese"])
    job.requires_demos = any(kw in text for kw in ["demo", "presentation", "client-facing", "customer-facing"])

    return job


def fetch_url(url: str, headers: Optional[dict] = None) -> Optional[str]:
    """Fetch URL content with basic error handling."""
    try:
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0 (compatible; JobSearchBot/1.0)")
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [!] Failed to fetch {url}: {e}")
        return None


# ============================================================
# SCRAPERS
# ============================================================

def scrape_greenhouse(company: str, slug: str) -> list[JobListing]:
    """Scrape jobs from Greenhouse job boards."""
    jobs = []
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
    print(f"  Fetching Greenhouse: {company} ({slug})...")

    content = fetch_url(url)
    if not content:
        return jobs

    try:
        data = json.loads(content)
        for posting in data.get("jobs", []):
            title = posting.get("title", "")
            if not is_relevant_title(title):
                continue

            location = posting.get("location", {}).get("name", "")
            job = JobListing(
                title=title,
                company=company,
                location=location,
                url=posting.get("absolute_url", ""),
                source="Greenhouse",
                role_type="se" if "solutions engineer" in title.lower() else "other",
            )
            jobs.append(detect_flags(job))
    except json.JSONDecodeError:
        print(f"  [!] Failed to parse Greenhouse response for {company}")

    return jobs


def scrape_lever(company: str, slug: str) -> list[JobListing]:
    """Scrape jobs from Lever job boards."""
    jobs = []
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    print(f"  Fetching Lever: {company} ({slug})...")

    content = fetch_url(url)
    if not content:
        return jobs

    try:
        data = json.loads(content)
        for posting in data:
            title = posting.get("text", "")
            if not is_relevant_title(title):
                continue

            categories = posting.get("categories", {})
            location = categories.get("location", "")
            job = JobListing(
                title=title,
                company=company,
                location=location,
                url=posting.get("hostedUrl", ""),
                source="Lever",
                role_type="se" if "solutions engineer" in title.lower() else "other",
            )
            jobs.append(detect_flags(job))
    except json.JSONDecodeError:
        print(f"  [!] Failed to parse Lever response for {company}")

    return jobs


def scrape_ashby(company: str, slug: str) -> list[JobListing]:
    """Scrape jobs from Ashby job boards."""
    jobs = []
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    print(f"  Fetching Ashby: {company} ({slug})...")

    content = fetch_url(url)
    if not content:
        return jobs

    try:
        data = json.loads(content)
        for posting in data.get("jobs", []):
            title = posting.get("title", "")
            if not is_relevant_title(title):
                continue

            location = posting.get("location", "")
            job = JobListing(
                title=title,
                company=company,
                location=location,
                url=posting.get("jobUrl", f"https://jobs.ashbyhq.com/{slug}"),
                source="Ashby",
                role_type="se" if "solutions engineer" in title.lower() else "other",
            )
            jobs.append(detect_flags(job))
    except json.JSONDecodeError:
        print(f"  [!] Failed to parse Ashby response for {company}")

    return jobs


def scrape_indeed_rss() -> list[JobListing]:
    """Scrape jobs from Indeed RSS feeds."""
    jobs = []
    for keyword in ROLE_KEYWORDS[:4]:
        for location in ["New+York", "Los+Angeles", "Philadelphia", "Remote"]:
            encoded = urllib.parse.quote(keyword)
            url = f"https://www.indeed.com/rss?q={encoded}&l={location}&sort=date&limit=25"
            print(f"  Fetching Indeed: '{keyword}' in {location}...")

            content = fetch_url(url)
            if not content:
                continue

            # Parse RSS XML simply
            items = re.findall(r"<item>(.*?)</item>", content, re.DOTALL)
            for item in items:
                title_match = re.search(r"<title>(.*?)</title>", item)
                link_match = re.search(r"<link>(.*?)</link>", item)
                desc_match = re.search(r"<description>(.*?)</description>", item, re.DOTALL)
                pub_match = re.search(r"<pubDate>(.*?)</pubDate>", item)

                if not title_match:
                    continue

                title = title_match.group(1).strip()
                if not is_relevant_title(title):
                    continue

                # Extract company from title (Indeed format: "Title - Company")
                parts = title.rsplit(" - ", 1)
                job_title = parts[0] if len(parts) > 1 else title
                company = parts[1] if len(parts) > 1 else "Unknown"

                description = desc_match.group(1).strip() if desc_match else ""
                description = re.sub(r"<[^>]+>", "", description)  # Strip HTML tags

                job = JobListing(
                    title=job_title,
                    company=company,
                    location=location.replace("+", " "),
                    description=description,
                    url=link_match.group(1).strip() if link_match else "",
                    source="Indeed",
                    posted_date=pub_match.group(1).strip() if pub_match else "",
                )
                jobs.append(detect_flags(job))

            time.sleep(1)  # Rate limit

    return jobs


def scrape_builtin() -> list[JobListing]:
    """Search BuiltIn for SE/SA roles."""
    jobs = []
    for keyword in ["solutions-engineer", "sales-engineer", "solutions-architect"]:
        for location in ["new-york", "los-angeles", "philadelphia", "remote"]:
            url = f"https://builtin.com/jobs/{location}/{keyword}"
            print(f"  Checking BuiltIn: {keyword} in {location}...")
            # Note: BuiltIn doesn't have a public API, so results are limited
            # The URL is logged for manual checking
            jobs.append(JobListing(
                title=f"[Check BuiltIn] {keyword.replace('-', ' ').title()} roles",
                company="Various",
                location=location.replace("-", " ").title(),
                url=url,
                source="BuiltIn",
                description=f"Check this BuiltIn URL for {keyword} roles in {location}",
            ))
    return jobs


def scrape_yc_jobs() -> list[JobListing]:
    """Scrape Y Combinator's job board."""
    jobs = []
    url = "https://www.workatastartup.com/jobs?role=sales&role=business"
    print(f"  Checking YC/Work at a Startup...")

    content = fetch_url("https://www.workatastartup.com/companies.json")
    if not content:
        # Fallback: just provide the URL for manual checking
        jobs.append(JobListing(
            title="[Check YC Jobs] Solutions/Sales Engineer roles at YC startups",
            company="Y Combinator Startups",
            location="Remote / Various",
            url="https://www.workatastartup.com/jobs?role=sales",
            source="YC Jobs",
            description="Check Y Combinator's job board for SE/SA roles at startups",
        ))
        return jobs

    try:
        companies = json.loads(content)
        for company_data in companies[:200]:  # Check first 200
            company_jobs = company_data.get("jobs", [])
            company_name = company_data.get("name", "Unknown")
            for j in company_jobs:
                title = j.get("title", "")
                if is_relevant_title(title):
                    job = JobListing(
                        title=title,
                        company=company_name,
                        location=j.get("location", ""),
                        url=j.get("url", ""),
                        source="YC Jobs",
                    )
                    jobs.append(detect_flags(job))
    except (json.JSONDecodeError, KeyError):
        pass

    return jobs


# ============================================================
# MAIN
# ============================================================

def send_to_app(jobs: list[JobListing]) -> bool:
    """Send scraped jobs to the web app for scoring and storage."""
    if not jobs:
        return True

    payload = json.dumps([asdict(j) for j in jobs]).encode("utf-8")
    req = urllib.request.Request(
        f"{APP_URL}/api/jobs/search",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
            print(f"  Sent {result.get('total', 0)} jobs → {result.get('matched', 0)} matched, {result.get('filtered', 0)} filtered")
            top = result.get("topMatches", [])
            if top:
                print("  Top matches:")
                for m in top[:5]:
                    print(f"    [{m['score']}] {m['title']} @ {m['company']}")
            return True
    except Exception as e:
        print(f"  [!] Failed to send to app: {e}")
        print(f"  [i] Saving to jobs_output.json instead...")
        with open("jobs_output.json", "w") as f:
            json.dump([asdict(j) for j in jobs], f, indent=2)
        return False


def main():
    parser = argparse.ArgumentParser(description="Job scraper for SE/SA roles")
    parser.add_argument("--source", choices=["greenhouse", "lever", "ashby", "indeed", "builtin", "yc", "careers", "all"], default="all")
    parser.add_argument("--output", help="Save to JSON file instead of sending to app")
    parser.add_argument("--dry-run", action="store_true", help="Just print jobs, don't send")
    args = parser.parse_args()

    all_jobs: list[JobListing] = []

    print("\n🔍 Job Scraper for Joesh Sethi — SE/SA Track\n")
    print("=" * 50)

    if args.source in ("greenhouse", "all"):
        print("\n📋 Greenhouse Boards:")
        for company, slug in GREENHOUSE_BOARDS.items():
            jobs = scrape_greenhouse(company, slug)
            all_jobs.extend(jobs)
            print(f"    Found {len(jobs)} relevant roles at {company}")
            time.sleep(0.5)

    if args.source in ("lever", "all"):
        print("\n📋 Lever Boards:")
        for company, slug in LEVER_BOARDS.items():
            jobs = scrape_lever(company, slug)
            all_jobs.extend(jobs)
            print(f"    Found {len(jobs)} relevant roles at {company}")
            time.sleep(0.5)

    if args.source in ("ashby", "all"):
        print("\n📋 Ashby Boards:")
        for company, slug in ASHBY_BOARDS.items():
            jobs = scrape_ashby(company, slug)
            all_jobs.extend(jobs)
            print(f"    Found {len(jobs)} relevant roles at {company}")
            time.sleep(0.5)

    if args.source in ("indeed", "all"):
        print("\n📋 Indeed RSS:")
        indeed_jobs = scrape_indeed_rss()
        all_jobs.extend(indeed_jobs)
        print(f"    Found {len(indeed_jobs)} relevant roles")

    if args.source in ("builtin", "all"):
        print("\n📋 BuiltIn:")
        builtin_jobs = scrape_builtin()
        all_jobs.extend(builtin_jobs)

    if args.source in ("yc", "all"):
        print("\n📋 Y Combinator Jobs:")
        yc_jobs = scrape_yc_jobs()
        all_jobs.extend(yc_jobs)
        print(f"    Found {len(yc_jobs)} relevant roles")

    # Summary
    print(f"\n{'=' * 50}")
    print(f"Total jobs found: {len(all_jobs)}")

    # Deduplicate
    seen = set()
    unique_jobs = []
    for job in all_jobs:
        key = f"{job.title}|{job.company}".lower()
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)
    print(f"Unique jobs: {len(unique_jobs)}")

    if args.dry_run:
        for job in unique_jobs:
            print(f"  [{job.source}] {job.title} @ {job.company} ({job.location})")
        return

    if args.output:
        with open(args.output, "w") as f:
            json.dump([asdict(j) for j in unique_jobs], f, indent=2)
        print(f"\nSaved to {args.output}")
        return

    # Send to web app
    print("\nSending to web app...")
    send_to_app(unique_jobs)
    print("\nDone! Check http://localhost:3000/jobs for scored results.\n")


if __name__ == "__main__":
    main()
