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
    # AI / ML
    "Anthropic": "anthropic",
    "Cohere": "cohere",
    "Scale AI": "scaleai",
    "Runway": "runwayml",
    "Synthesia": "synthesia",
    "Stability AI": "stabilityai",
    "Jasper": "jasper",
    "Writer": "writer",
    "Glean": "glean",
    "Harvey": "harvey",
    "Sierra": "sierra",
    "Moveworks": "moveworks",
    "Guru": "guru",
    "Cogito": "cogito",

    # Cloud & Data Infrastructure
    "MongoDB": "mongodb",
    "Datadog": "datadog",
    "Snowflake": "snowflake",
    "Databricks": "databricks",
    "Elastic": "elastic",
    "Confluent": "confluent",
    "dbt Labs": "dbtlabs",
    "Fivetran": "fivetran",
    "Airbyte": "airbyte",
    "Starburst": "starburst",
    "Imply": "imply",
    "ClickHouse": "clickhouse",
    "SingleStore": "singlestore",
    "CockroachLabs": "cockroachlabs",
    "PlanetScale": "planetscale",
    "Crunchy Data": "crunchydata",
    "Timescale": "timescale",
    "Astronomer": "astronomer",
    "Prefect": "prefect",
    "Dagster": "dagster",
    "Hightouch": "hightouch",
    "Census": "census",
    "Rudderstack": "rudderstack",
    "Segment": "segment",
    "Monte Carlo": "montecarlodata",
    "Atlan": "atlan",
    "Collibra": "collibra",
    "Alation": "alation",

    # Security
    "CrowdStrike": "crowdstrike",
    "Palo Alto Networks": "paloaltonetworks",
    "Zscaler": "zscaler",
    "Cloudflare": "cloudflare",
    "Okta": "okta",
    "Lacework": "lacework",
    "Snyk": "snyk",
    "Sysdig": "sysdig",
    "Drata": "drata",
    "Vanta": "vanta",
    "Secureframe": "secureframe",
    "Orca Security": "orca",
    "Wiz": "wiz",
    "Abnormal Security": "abnormalsecurity",
    "Recorded Future": "recordedfuture",
    "Swimlane": "swimlane",
    "Tines": "tines",

    # DevOps / Platform
    "HashiCorp": "hashicorp",
    "PagerDuty": "pagerduty",
    "New Relic": "newrelic",
    "Splunk": "splunk",
    "Sumo Logic": "sumologic",
    "Dynatrace": "dynatrace",
    "Honeycomb": "honeycomb",
    "Grafana": "grafana",
    "LaunchDarkly": "launchdarkly",
    "Split": "split",
    "Harness": "harness",
    "Cortex": "cortexapps",
    "OpsLevel": "opslevel",
    "Backstage": "backstage",
    "Port": "port",
    "Humanitec": "humanitec",
    "Pulumi": "pulumi",
    "Spacelift": "spacelift",

    # SaaS / CRM / Sales
    "HubSpot": "hubspot",
    "Zendesk": "zendesk",
    "Intercom": "intercom",
    "Freshworks": "freshworks",
    "Gong": "gong",
    "Salesloft": "salesloft",
    "Outreach": "outreach",
    "Clari": "clari",
    "Chorus": "chorus",
    "Revenue.io": "revenue",
    "Seismic": "seismic",
    "Highspot": "highspot",
    "Showpad": "showpad",
    "Mindtickle": "mindtickle",
    "Allego": "allego",
    "Brainshark": "brainshark",
    "Demandbase": "demandbase",
    "6sense": "sixsense",
    "Bombora": "bombora",
    "ZoomInfo": "zoominfo",
    "Apollo.io": "apolloio",
    "Lusha": "lusha",
    "Mixpanel": "mixpanel",
    "Amplitude": "amplitude",
    "Braze": "braze",
    "Iterable": "iterable",
    "Klaviyo": "klaviyo",
    "Attentive": "attentive",
    "Pendo": "pendo",
    "FullStory": "fullstory",
    "Heap": "heap",
    "Gainsight": "gainsight",
    "Totango": "totango",
    "ChurnZero": "churnzero",
    "Vitally": "vitally",

    # Collaboration / Productivity
    "Notion": "notion",
    "Airtable": "airtable",
    "Coda": "coda",
    "Webflow": "webflow",
    "Contentful": "contentful",
    "Retool": "retool",
    "Zapier": "zapier",
    "Workato": "workato",
    "Tray.io": "trayio",
    "Make": "make",

    # HR Tech
    "Rippling": "rippling",
    "Lattice": "lattice",
    "Culture Amp": "cultureamp",
    "BetterUp": "betterup",
    "Leapsome": "leapsome",
    "Workramp": "workramp",
    "15Five": "15five",
    "Betterworks": "betterworks",
    "Navan": "navan",

    # Fintech
    "Stripe": "stripe",
    "Plaid": "plaid",
    "Brex": "brex",
    "Ramp": "ramp",
    "Airbase": "airbase",
    "Zip": "zip",
    "Vendr": "vendr",
    "Coupa": "coupa",
    "Tropic": "tropic",
    "Zylo": "zylo",
    "Mosaic": "mosaic",
    "Pigment": "pigment",
    "Planful": "planful",
    "Anaplan": "anaplan",
    "CaptivateIQ": "captivateiq",
    "Spiff": "spiff",
    "Xactly": "xactly",
    "QuotaPath": "quotapath",
    "Commissionly": "commissionly",

    # Sports Tech
    "DraftKings": "draftkings",
    "FanDuel": "fanduel",
    "Sportradar": "sportradar",
    "Hudl": "hudl",
    "Whoop": "whoop",
    "PrizePicks": "prizepicks",
    "Underdog Fantasy": "underdogfantasy",
    "Catapult": "catapultsports",
    "Genius Sports": "geniussports",
    "Stats Perform": "statsperform",
    "Second Spectrum": "secondspectrum",
    "SeatGeek": "seatgeek",
    "Vividseats": "vividseats",
    "Eventbrite": "eventbrite",
    "Cvent": "cvent",

    # Other notable tech
    "Benchling": "benchling",
    "Warp": "warp",
    "Figma": "figma",
    "Loom": "loom",
    "Miro": "miro",
    "DocuSign": "docusign",
    "PandaDoc": "pandadoc",
    "Ironclad": "ironclad",
    "Clio": "clio",
    "Twilio": "twilio",
    "Sendbird": "sendbird",
    "Bandwidth": "bandwidth",
    "Vonage": "vonage",
    "MessageBird": "messagebird",
    "OpenPhone": "openphone",
    "Aircall": "aircall",
    "Dialpad": "dialpad",
    "RingCentral": "ringcentral",
    "Talkdesk": "talkdesk",
    "Five9": "five9",
    "Sprinklr": "sprinklr",
    "Hootsuite": "hootsuite",
    "Sprout Social": "sproutsocial",
    "Later": "later",
    "Buffer": "buffer",
    "monday.com": "mondaydotcom",
    "Asana": "asana",
    "ClickUp": "clickup",
    "Smartsheet": "smartsheet",
    "Wrike": "wrike",
    "Teamwork": "teamwork",
    "Basecamp": "basecamp",
    "Productboard": "productboard",
    "Aha!": "ahadotio",
    "Roadmunk": "roadmunk",
    "Sigma Computing": "sigmacomputing",
    "ThoughtSpot": "thoughtspot",
    "Sisense": "sisense",
    "Metabase": "metabase",
    "Looker": "looker",
    "Hex": "hex",
    "Mode": "mode",
    "Samsara": "samsara",
    "Verkada": "verkada",
    "Matterport": "matterport",
    "Veeva": "veeva",
    "Palantir": "palantir",
    "C3.ai": "c3dotai",
    "DataRobot": "datarobot",
    "H2O.ai": "h2oai",
    "Weights & Biases": "wandb",
    "Determined AI": "determinedai",
    "Labelbox": "labelbox",
    "Scale AI": "scaleai",
    "Snorkel AI": "snorkel",
    "Aquant": "aquant",
    "Observe.AI": "observeai",
    "Cresta": "cresta",
    "Uniphore": "uniphore",
    "Deepgram": "deepgram",
    "AssemblyAI": "assemblyai",
    "Eleven Labs": "elevenlabs",
    "Descript": "descript",
    "Grammarly": "grammarly",
    "Writer": "writer",
    "Copy.ai": "copyai",
    "Typeface": "typeface",
    "Tome": "tome",
    "Beautiful.ai": "beautifulai",
    "Pitch": "pitch",
    "Canva": "canva",
    "Lottiefiles": "lottiefiles",
    "Storyblok": "storyblok",
    "Hygraph": "hygraph",
    "Sanity": "sanity",
    "Prismic": "prismic",
    "Kontent.ai": "kontent",
    "Agility CMS": "agilitycms",
    "Bloomreach": "bloomreach",
    "Sitecore": "sitecore",
    "Acquia": "acquia",
    "Optimizely": "optimizely",
    "VWO": "wingify",
    "Statsig": "statsig",
    "Eppo": "eppo",
    "GrowthBook": "growthbook",
    "Kameleoon": "kameleoon",
    "Insider": "useinsider",
    "Nosto": "nosto",
    "Dynamic Yield": "dynamicyield",
    "Yotpo": "yotpo",
    "Okendo": "okendo",
    "Stamped": "stamped",
    "LoyaltyLion": "loyaltylion",
    "Smile.io": "smileio",
    "Talon.One": "talonone",
    "Antavo": "antavo",
    "Emarsys": "emarsys",
    "Sailthru": "sailthru",
    "Marigold": "marigold",
    "Delivra": "delivra",
    "Omnisend": "omnisend",
    "Drip": "drip",
    "ActiveCampaign": "activecampaign",
    "ConvertKit": "convertkit",
    "Mailchimp": "mailchimp",
    "Constant Contact": "constantcontact",
    "Campaign Monitor": "campaignmonitor",
    "Dotdigital": "dotdigital",
    "Pardot": "pardot",
    "Marketo": "marketo",
    "Eloqua": "eloqua",
    "Act-On": "acton",
    "SharpSpring": "sharpspring",
    "LeadSquared": "leadsquared",
    "Pipedrive": "pipedrive",
    "Copper": "copper",
    "Close": "close",
    "Nutshell": "nutshell",
    "Insightly": "insightly",
    "Nimble": "nimble",
    "Streak": "streak",
    "Salesflare": "salesflare",
    "Zendesk Sell": "zendeskSell",
    "Freshsales": "freshsales",
    "Monday Sales CRM": "mondaycrm",
    "noCRM.io": "nocrm",
    "Apptivo": "apptivo",
}

# Lever company slugs
LEVER_BOARDS = {
    "Box": "box",
    "Boomi": "boomi",
    "Gong": "gong",
    "Outreach": "outreach",
    "SalesLoft": "salesloft",
    "Drift": "drift",
    "Chorus": "chorus",
    "LeanData": "leandata",
    "Chili Piper": "chilipiper",
    "Calendly": "calendly",
    "Mixmax": "mixmax",
    "Yesware": "yesware",
    "Groove": "groove",
    "QuotaPath": "quotapath",
    "Reprise": "reprise",
    "Walnut": "walnut",
    "Navattic": "navattic",
    "Storylane": "storylane",
    "Demostack": "demostack",
    "Consensus": "consensus",
    "Vivun": "vivun",
    "Klue": "klue",
    "Crayon": "crayon",
    "Kompyte": "kompyte",
    "G2": "g2",
    "TrustRadius": "trustradius",
    "Medallia": "medallia",
    "Qualtrics": "qualtrics",
    "InMoment": "inmoment",
    "Birdeye": "birdeye",
    "Podium": "podium",
    "Yext": "yext",
    "Uberall": "uberall",
    "SOCi": "soci",
    "Reputation": "reputation",
    "Sprinklr": "sprinklr",
    "Oktopost": "oktopost",
    "Brandwatch": "brandwatch",
    "Meltwater": "meltwater",
    "Cision": "cision",
    "Mention": "mention",
    "Talkwalker": "talkwalker",
    "Audiense": "audiense",
    "Pulsar": "pulsar",
    "Affinio": "affinio",
    "NetBase Quid": "netbasequid",
    "Synthesio": "synthesio",
    "Infegy": "infegy",
    "Nuvi": "nuvi",
    "Klear": "klear",
    "Traackr": "traackr",
    "IZEA": "izea",
    "CreatorIQ": "creatoriq",
    "Grin": "grin",
    "Aspire": "aspire",
    "Mavrck": "mavrck",
    "Dovetale": "dovetale",
    "Impact": "impact",
    "PartnerStack": "partnerstack",
    "Alliances": "alliances",
    "Crossbeam": "crossbeam",
    "Reveal": "reveal",
    "Tackle.io": "tackle",
    "WorkSpan": "workspan",
}

# Ashby company slugs
ASHBY_BOARDS = {
    "OpenAI": "openai",
    "Linear": "linear",
    "Vercel": "vercel",
    "Loom": "loom",
    "Figma": "figma",
    "Notion": "notion",
    "Perplexity": "perplexityai",
    "Mistral AI": "mistral",
    "Together AI": "together",
    "Replicate": "replicate",
    "Modal": "modal",
    "Anyscale": "anyscale",
    "Weights & Biases": "wandb",
    "Roboflow": "roboflow",
    "Encord": "encord",
    "V7": "v7labs",
    "Superannotate": "superannotate",
    "Hasura": "hasura",
    "Neon": "neon",
    "Supabase": "supabase",
    "PlanetScale": "planetscale",
    "Xata": "xata",
    "Turso": "turso",
    "Railway": "railway",
    "Render": "render",
    "Fly.io": "fly",
    "Temporal": "temporal",
    "Inngest": "inngest",
    "Trigger.dev": "trigger",
    "Resend": "resend",
    "Loops": "loops",
    "Postmark": "postmark",
    "Customer.io": "customerio",
    "Chameleon": "chameleon",
    "Appcues": "appcues",
    "UserPilot": "userpilot",
    "Userflow": "userflow",
    "Userpilot": "userpilot",
    "Aptrinsic": "aptrinsic",
    "Stonly": "stonly",
    "Intercom": "intercom",
    "Front": "front",
    "Missive": "missive",
    "Superhuman": "superhuman",
    "Shortwave": "shortwave",
    "Sanebox": "sanebox",
    "Spark Mail": "sparkmail",
    "Newton": "newton",
    "Mimestream": "mimestream",
    "Hey": "hey",
    "Fastmail": "fastmail",
    "Proton": "proton",
    "Skiff": "skiff",
    "Notion Mail": "notionmail",
    "Ramp": "ramp",
    "Mercury": "mercury",
    "Brex": "brex",
    "Arc": "arc",
    "Warp": "warp",
    "Cursor": "cursor",
    "Windsurf": "windsurf",
    "Tabnine": "tabnine",
    "Codeium": "codeium",
    "Sourcegraph": "sourcegraph",
    "Swimm": "swimm",
    "Mintlify": "mintlify",
    "ReadMe": "readme",
    "Gitbook": "gitbook",
    "Confluence": "confluence",
    "Slab": "slab",
    "Outline": "outline",
    "Nuclino": "nuclino",
    "Slite": "slite",
    "Tettra": "tettra",
    "Helpjuice": "helpjuice",
    "Document360": "document360",
    "Guru": "getguru",
    "Bloomfire": "bloomfire",
    "Elium": "elium",
    "Shelf.io": "shelf",
    "Stonly": "stonly",
    "Klutch": "klutch",
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


def is_sdr_title(title: str) -> bool:
    """Check if job title is specifically an SDR/BDR role."""
    t = title.lower()
    return any(kw in t for kw in [
        "sales development", "sdr", "bdr", "business development representative",
        "business development rep", "outbound sales", "outbound representative",
    ])


# Locations to accept for SDR roles: target cities or remote US
TARGET_LOCATION_PATTERNS = [
    r"remote",
    r"new york|nyc|manhattan|brooklyn|queens|bronx",
    r"los angeles|la\b|santa monica|culver city|west hollywood|hollywood",
    r"philadelphia|philly",
    r"united states|usa|\bus\b",          # "Remote, US" or "Remote United States"
]

FOREIGN_LOCATION_PATTERNS = [
    r"united kingdom|uk\b|great britain|england|london|manchester|edinburgh",
    r"canada|toronto|vancouver|montreal|calgary|ottawa",
    r"australia|sydney|melbourne|brisbane|perth",
    r"india|bangalore|bengaluru|delhi|mumbai|hyderabad|pune|chennai|gurgaon|gurugram|noida|kolkata|ahmedabad|, ind\b",
    r"ireland|dublin",
    r"germany|berlin|munich|hamburg|frankfurt",
    r"france|paris|lyon|toulouse",
    r"netherlands|amsterdam|rotterdam",
    r"spain|madrid|barcelona",
    r"israel|tel aviv",
    r"brazil|sao paulo|são paulo|rio de janeiro",
    r"singapore",
    r"japan|tokyo|osaka",
    r"south korea|korea|seoul",
    r"poland|warsaw|krakow",
    r"sweden|stockholm",
    r"denmark|copenhagen",
    r"norway|oslo",
    r"finland|helsinki",
    r"switzerland|zurich|geneva",
    r"austria|vienna",
    r"belgium|brussels",
    r"portugal|lisbon",
    r"czech|prague",
    r"hungary|budapest",
    r"romania|bucharest",
    r"ukraine|kyiv",
    r"russia|moscow",
    r"china|beijing|shanghai|shenzhen",
    r"hong kong",
    r"taiwan|taipei",
    r"indonesia|jakarta",
    r"thailand|bangkok",
    r"philippines|manila",
    r"vietnam|ho chi minh",
    r"malaysia|kuala lumpur",
    r"mexico|mexico city",
    r"colombia|bogota",
    r"argentina|buenos aires",
    r"chile|santiago",
    r"peru|lima",
    r"south africa|johannesburg|cape town",
    r"nigeria|lagos",
    r"kenya|nairobi",
    r"egypt|cairo",
    r"uae|dubai|abu dhabi",
    r"saudi arabia|riyadh",
]


def is_us_target_location(location: str) -> bool:
    """
    Strict location filter:
    - NYC / LA / Philadelphia: hybrid or in-office OK
    - Anywhere else: remote-only
    - Foreign: always rejected
    """
    if not location:
        return True  # No location info — keep (could be remote)
    loc = location.lower().strip()

    # Always reject foreign locations
    for pattern in FOREIGN_LOCATION_PATTERNS:
        if re.search(pattern, loc):
            return False

    # Accept if explicitly remote (remote-only rule for non-target cities)
    if re.search(r'\bremote\b', loc):
        return True

    # Accept "United States" / "USA" / "US" alone — no specific city = nationwide/remote
    if re.match(r'^(united states|usa?|u\.s\.?)\s*$', loc):
        return True

    # Accept target cities (hybrid/in-office OK here)
    if re.search(r'new york|nyc|manhattan|brooklyn|queens|new jersey', loc):
        return True
    if re.search(r'los angeles|\bla,|\bla\b|santa monica|culver city|west hollywood|burbank|pasadena|long beach', loc):
        return True
    if re.search(r'philadelphia|philly', loc):
        return True

    # Everything else is a specific non-target city — reject
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

    payload = json.dumps({"jobs": [asdict(j) for j in jobs]}).encode("utf-8")
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
    parser = argparse.ArgumentParser(description="Job scraper for SE/SA/SDR roles")
    parser.add_argument("--source", choices=["greenhouse", "lever", "ashby", "indeed", "builtin", "yc", "careers", "all"], default="all")
    parser.add_argument("--output", help="Save to JSON file instead of sending to app")
    parser.add_argument("--dry-run", action="store_true", help="Just print jobs, don't send")
    parser.add_argument("--sdr", action="store_true", help="SDR roles only (NYC/LA/Philly/Remote US)")
    args = parser.parse_args()

    all_jobs: list[JobListing] = []

    mode = "SDR-only (NYC/LA/Philly/Remote US)" if args.sdr else "SE/SA Track"
    print(f"\n🔍 Job Scraper for Joesh Sethi — {mode}\n")
    print("=" * 50)

    if args.source in ("greenhouse", "all"):
        print(f"\n📋 Greenhouse Boards ({len(GREENHOUSE_BOARDS)} companies):")
        for company, slug in GREENHOUSE_BOARDS.items():
            jobs = scrape_greenhouse(company, slug)
            if args.sdr:
                jobs = [j for j in jobs if is_sdr_title(j.title) and is_us_target_location(j.location)]
            all_jobs.extend(jobs)
            if jobs:
                print(f"    {company}: {len(jobs)} roles")
            time.sleep(0.3)

    if args.source in ("lever", "all"):
        print(f"\n📋 Lever Boards ({len(LEVER_BOARDS)} companies):")
        for company, slug in LEVER_BOARDS.items():
            jobs = scrape_lever(company, slug)
            if args.sdr:
                jobs = [j for j in jobs if is_sdr_title(j.title) and is_us_target_location(j.location)]
            all_jobs.extend(jobs)
            if jobs:
                print(f"    {company}: {len(jobs)} roles")
            time.sleep(0.3)

    if args.source in ("ashby", "all"):
        print(f"\n📋 Ashby Boards ({len(ASHBY_BOARDS)} companies):")
        for company, slug in ASHBY_BOARDS.items():
            jobs = scrape_ashby(company, slug)
            if args.sdr:
                jobs = [j for j in jobs if is_sdr_title(j.title) and is_us_target_location(j.location)]
            all_jobs.extend(jobs)
            if jobs:
                print(f"    {company}: {len(jobs)} roles")
            time.sleep(0.3)

    if not args.sdr:
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

    if args.sdr and unique_jobs:
        print("\nSDR roles found:")
        for j in sorted(unique_jobs, key=lambda x: x.company):
            remote_tag = " [REMOTE]" if j.is_remote or "remote" in j.location.lower() else ""
            print(f"  {j.company:30s} {j.title:50s} {j.location}{remote_tag}")

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
