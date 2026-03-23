import { PROFILE } from './profile';

export interface JobListing {
  id?: number;
  title: string;
  company: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  url?: string;
  source?: string;
  posted_date?: string;
  role_type?: string;
  is_remote?: boolean;
  is_sports_tech?: boolean;
  has_apac_exposure?: boolean;
  requires_demos?: boolean;
}

export interface ScoredJob extends JobListing {
  match_score: number;
  match_reasons: string[];
}

const EXCLUDE_TITLE_PATTERNS = [
  /\bsoftware engineer\b/i,
  /\bbackend developer\b/i,
  /\bfrontend developer\b/i,
  /\bfull.?stack developer\b/i,
  /\bdata scientist\b/i,
  /\bml researcher\b/i,
  /\bmachine learning researcher\b/i,
  /\bproduct manager\b/i,
  /\bstaff engineer\b/i,
  /\bprincipal engineer\b/i,
];

const EXCLUDE_INDUSTRY_PATTERNS = [
  /\binsurance\b/i,
  /\bgovernment\b/i,
  /\bpublic sector\b/i,
  /\bconsulting firm\b/i,
];

export function scoreJob(job: JobListing): ScoredJob {
  let score = 0;
  const reasons: string[] = [];

  // Exclude bad fits
  for (const pattern of EXCLUDE_TITLE_PATTERNS) {
    if (pattern.test(job.title)) {
      return { ...job, match_score: 0, match_reasons: ["Excluded: role type not targeted"] };
    }
  }

  if (job.description) {
    for (const pattern of EXCLUDE_INDUSTRY_PATTERNS) {
      if (pattern.test(job.description)) {
        return { ...job, match_score: 0, match_reasons: ["Excluded: industry not targeted"] };
      }
    }
  }

  // Role title match (0-25 points)
  const titleLower = job.title.toLowerCase();
  if (/solutions? engineer/i.test(titleLower)) { score += 25; reasons.push("Direct SE title match"); }
  else if (/sales engineer/i.test(titleLower)) { score += 25; reasons.push("Direct Sales Engineer match"); }
  else if (/solutions? architect/i.test(titleLower)) { score += 22; reasons.push("Solutions Architect match"); }
  else if (/solutions? consultant/i.test(titleLower)) { score += 20; reasons.push("Solutions Consultant match"); }
  else if (/technical account manager/i.test(titleLower)) { score += 20; reasons.push("TAM role match"); }
  else if (/pre.?sales/i.test(titleLower)) { score += 22; reasons.push("Pre-sales role match"); }
  else if (/customer engineer/i.test(titleLower)) { score += 20; reasons.push("Customer Engineer (SE-adjacent)"); }
  else if (/field engineer/i.test(titleLower)) { score += 18; reasons.push("Field Engineer match"); }
  else if (/sdr|sales development/i.test(titleLower)) { score += 15; reasons.push("SDR — foot-in-door opportunity"); }
  else if (/demo engineer/i.test(titleLower)) { score += 22; reasons.push("Demo Engineer — perfect fit"); }

  // Company match (0-20 points)
  const companyLower = job.company.toLowerCase();
  const allDream = PROFILE.targetCompanies.dreamTier.map(c => c.toLowerCase());
  const allHigh = PROFILE.targetCompanies.highPriority.map(c => c.toLowerCase());
  const allSports = PROFILE.targetCompanies.sportsTech.map(c => c.toLowerCase());

  if (allDream.some(c => companyLower.includes(c.toLowerCase()))) {
    score += 20; reasons.push("Dream tier company");
  } else if (allHigh.some(c => companyLower.includes(c.toLowerCase()))) {
    score += 15; reasons.push("High priority company");
  } else if (allSports.some(c => companyLower.includes(c.toLowerCase()))) {
    score += 18; reasons.push("Sports tech company");
  }

  // Location match (0-10 points)
  const locLower = (job.location || '').toLowerCase();
  if (job.is_remote || /remote/i.test(locLower)) {
    score += 10; reasons.push("Remote — full flexibility");
  } else if (/new york|nyc|manhattan|brooklyn/i.test(locLower)) {
    score += 10; reasons.push("NYC location match");
  } else if (/los angeles|la\b|santa monica|culver city/i.test(locLower)) {
    score += 10; reasons.push("LA location match");
  } else if (/philadelphia|philly/i.test(locLower)) {
    score += 10; reasons.push("Philly location match");
  } else if (/hybrid/i.test(locLower)) {
    score += 7; reasons.push("Hybrid — check location");
  }

  // Differentiator signals from description (0-25 points)
  const desc = (job.description || '').toLowerCase();

  if (/japan|apac|asia.?pacific|japanese/i.test(desc)) {
    score += 8; reasons.push("APAC/Japanese language opportunity");
  }
  if (/demo|presentation|client.?facing|customer.?facing/i.test(desc)) {
    score += 5; reasons.push("Demo/presentation skills valued");
  }
  if (/gen.?ai|generative ai|llm|openai|claude|vector|rag|pinecone/i.test(desc)) {
    score += 7; reasons.push("Gen AI experience relevant");
  }
  if (/pre.?sales|proof of concept|poc\b/i.test(desc)) {
    score += 5; reasons.push("Pre-sales/PoC experience valued");
  }

  // Already applied penalty
  if (PROFILE.appliedCompanies.some(c => companyLower.includes(c.toLowerCase()))) {
    score -= 5; reasons.push("Already applied — check for new roles");
  }

  // Cap at 100
  score = Math.min(100, Math.max(0, score));

  return { ...job, match_score: score, match_reasons: reasons };
}

export function rankJobs(jobs: JobListing[]): ScoredJob[] {
  return jobs
    .map(scoreJob)
    .filter(j => j.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score);
}
