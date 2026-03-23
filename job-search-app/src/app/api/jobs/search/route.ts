import { NextRequest, NextResponse } from 'next/server';
import { scoreJob } from '@/lib/scorer';
import { ROLE_KEYWORDS } from '@/lib/profile';
import { getDb } from '@/lib/db';

// Simulated job search - in production this would call real APIs
// The Python scripts handle actual scraping; this endpoint processes and stores results
export async function POST(req: NextRequest) {
  const { query, sources, location } = await req.json();

  // Build search terms from profile if no custom query
  const searchTerms = query || ROLE_KEYWORDS.slice(0, 5).join(' OR ');

  // This endpoint is designed to receive jobs from the Python scraper
  // and score/store them. For now, return instructions.
  return NextResponse.json({
    message: "Use the Python scraper scripts to fetch jobs, then POST results to /api/jobs",
    searchTerms,
    suggestedSources: sources || ['linkedin', 'greenhouse', 'lever', 'indeed', 'builtin'],
    location: location || 'NYC, LA, Philadelphia, Remote',
    instructions: [
      "1. Run: python scripts/scrape_jobs.py",
      "2. The script will search across configured job boards",
      "3. Results are automatically scored and sent to /api/jobs",
      "4. Check the dashboard for scored results",
    ],
  });
}

// Score a batch of raw job listings
export async function PUT(req: NextRequest) {
  const { jobs } = await req.json();

  if (!Array.isArray(jobs)) {
    return NextResponse.json({ error: "Expected { jobs: [...] }" }, { status: 400 });
  }

  const scored = jobs.map(scoreJob).filter(j => j.match_score > 0);

  // Store scored jobs
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO jobs (title, company, location, salary_min, salary_max, description, url, source, posted_date, match_score, match_reasons, role_type, is_remote, is_sports_tech, has_apac_exposure, requires_demos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((scoredJobs: typeof scored) => {
    for (const job of scoredJobs) {
      stmt.run(
        job.title, job.company, job.location || '', job.salary_min || null, job.salary_max || null,
        job.description || '', job.url || '', job.source || '', job.posted_date || '',
        job.match_score, JSON.stringify(job.match_reasons), job.role_type || '',
        job.is_remote ? 1 : 0, job.is_sports_tech ? 1 : 0, job.has_apac_exposure ? 1 : 0,
        job.requires_demos ? 1 : 0
      );
    }
  });

  insertMany(scored);

  return NextResponse.json({
    total: jobs.length,
    matched: scored.length,
    filtered: jobs.length - scored.length,
    topMatches: scored.slice(0, 10).map(j => ({
      title: j.title,
      company: j.company,
      score: j.match_score,
      reasons: j.match_reasons,
    })),
  });
}
