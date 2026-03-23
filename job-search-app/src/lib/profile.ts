export const PROFILE = {
  name: "Joesh Singh Sethi",
  email: "joesh.sethi39@gmail.com",
  phone: "(626) 487-4497",
  citizenship: ["US Citizen", "Japanese Citizen"],
  locations: ["NYC", "LA", "Philadelphia"],
  openToRemote: true,

  targetRoles: [
    "Solutions Engineer",
    "Sales Engineer",
    "Solutions Architect",
    "Solutions Consultant",
    "Associate Solutions Engineer",
    "Sales Development Representative",
    "Technical Account Manager",
    "Pre-Sales Engineer",
  ],

  targetCompanies: {
    dreamTier: [
      "Anthropic", "OpenAI", "Cohere", "AWS", "Google Cloud",
      "Salesforce", "Snowflake", "Databricks", "NBA",
    ],
    highPriority: [
      "Monday.com", "Atlassian", "Warp", "Synthesia", "Rippling",
      "Box", "Boomi", "MongoDB", "Navan", "Datadog", "Dynatrace",
      "Seismic", "Astronomer", "Benchling", "New Era Technology",
    ],
    sportsTech: [
      "Sportradar", "Stats Perform", "Genius Sports", "Second Spectrum",
      "Catapult", "Hudl", "PlayMetrics", "Zelus Analytics", "Whoop",
      "Strivr", "HomeCourt", "ShotTracker", "Pixellot", "Tempus Ex",
      "DraftKings", "FanDuel", "Underdog Fantasy", "PrizePicks",
      "Sporta Japan", "Trackman", "Hawk-Eye", "ChyronHego", "WSC Sports",
      "Veo", "PlayerMaker", "Kinexon", "Arctic Intelligence", "Rapsodo",
    ],
    referralLeads: [
      "DoorDash", "Robert Walters", "Concentrix", "Bennie", "Comcast",
      "Motion Recruitment", "CassidyAI", "Sporta", "Boomi", "Meta",
      "Amazon", "Ocrolus", "Atlassian", "Netflix", "Salesforce",
      "Disney", "MongoDB", "Navan", "Datadog", "Synthesia", "Shopify",
      "Anthropic",
    ],
  },

  differentiators: [
    "Japanese fluency — APAC exposure roles",
    "Live demo experience — client-facing presentations",
    "Gen AI builder — OpenAI, Claude, Pinecone, Stable Diffusion",
    "4 years C-suite consulting at Accenture",
    "Revenue-connected: $500K deal, $200M+ relationship",
  ],

  skills: {
    technical: [
      "AWS", "Python", "SQL", "Java", "HTML/CSS", "OpenAI API",
      "Claude API", "Pinecone", "Stable Diffusion", "Azure Speech-to-Text",
      "Prompt Engineering", "RAG", "Vector Search", "Clustering Algorithms",
      "GitHub", "Agile/Scrum", "Jira",
    ],
    preSales: [
      "Live product demos", "Design thinking facilitation",
      "Stakeholder interviews", "Solution roadmapping",
      "Executive presentations", "Proof of concept development",
    ],
    languages: ["English (native)", "Japanese (fluent)"],
  },

  compensation: {
    preferred: { min: 130000, note: "for NYC roles" },
    entryLevel: { min: 50000, max: 80000, note: "SDR/Associate SE at high-upside companies" },
  },

  excludeRoles: [
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Data Scientist", "ML Researcher", "Product Manager",
  ],

  excludeIndustries: [
    "Insurance", "Government", "Traditional Consulting", "Healthcare (non-SaaS)",
  ],

  experience: {
    current: "Technology Architect Senior Analyst at Accenture (Aug 2021 - Sep 2025)",
    education: "NYU - BA Computer Science (2017-2021)",
    keyProjects: [
      {
        name: "Salesforce Product Recommendation Copilot",
        tech: "OpenAI Realtime API, Pinecone, Salesforce",
        impact: "Voice-activated sales assistant for real-time product matching",
      },
      {
        name: "AI Commercial Ad Creation Tool (Peacock/NBCUniversal)",
        tech: "Claude, Stable Diffusion, Azure Speech-to-Text",
        impact: "End-to-end AI video ad generation from advertiser briefs",
      },
      {
        name: "Gen AI Security Document Search Bot",
        tech: "Pinecone, RAG, async functions",
        impact: "Natural language search over thousands of security docs",
      },
      {
        name: "Fannie Mae Quality Engineering Assessment",
        tech: "Consulting, stakeholder interviews",
        impact: "$500K follow-on implementation deal",
      },
      {
        name: "NY State Retirement System Redesign",
        tech: "QE, stakeholder management, deployment",
        impact: "$1B/month pension system, $200K+ annual savings",
      },
    ],
  },

  resumeText: {
    version1: "general_purpose",
    version2: "se_focused",
  },

  appliedCompanies: [
    "Monday.com", "Box", "Anthropic", "Netflix", "Salesforce", "Disney",
    "MSG", "Celonis", "Coinbase", "Replit", "LogRocket", "Hinge", "Braze",
    "NBA", "FanDuel", "Blackrock", "Google", "TikTok", "Atlassian",
    "Synthesia", "Warp", "Rippling", "MongoDB", "Datadog", "Dynatrace",
    "Benchling", "Astronomer", "StubHub", "DraftKings",
  ],

  contacts: [
    { name: "Grace Stuart", company: "Anthropic", role: "SDR contact" },
  ],
};

export const JOB_SOURCES = {
  primary: [
    { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs" },
    { name: "Greenhouse", url: "https://greenhouse.io" },
    { name: "Lever", url: "https://lever.co" },
    { name: "Ashby", url: "https://ashbyhq.com" },
    { name: "BuiltIn", url: "https://builtin.com" },
    { name: "Indeed", url: "https://indeed.com" },
  ],
  secondary: [
    { name: "Wellfound", url: "https://wellfound.com" },
    { name: "Y Combinator", url: "https://news.ycombinator.com/jobs" },
    { name: "Workday", url: "https://workday.com" },
  ],
};

export const ROLE_KEYWORDS = [
  "solutions engineer", "sales engineer", "solutions architect",
  "solutions consultant", "pre-sales engineer", "pre sales engineer",
  "technical account manager", "associate solutions engineer",
  "sales development representative", "SDR", "SE",
  "customer engineer", "field engineer", "demo engineer",
];
