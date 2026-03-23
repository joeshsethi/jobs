import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const minScore = url.searchParams.get('min_score');
  const company = url.searchParams.get('company');
  const roleType = url.searchParams.get('role_type');
  const sportsTech = url.searchParams.get('sports_tech');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = 'SELECT * FROM jobs WHERE 1=1';
  const params: (string | number)[] = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (minScore) { query += ' AND match_score >= ?'; params.push(parseInt(minScore)); }
  if (company) { query += ' AND company LIKE ?'; params.push(`%${company}%`); }
  if (roleType) { query += ' AND role_type = ?'; params.push(roleType); }
  if (sportsTech === '1') { query += ' AND is_sports_tech = 1'; }

  query += ' ORDER BY match_score DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const jobs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };

  return NextResponse.json({ jobs, total: total.count });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  if (Array.isArray(body)) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO jobs (title, company, location, salary_min, salary_max, description, url, source, posted_date, match_score, match_reasons, role_type, is_remote, is_sports_tech, has_apac_exposure, requires_demos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((jobs: typeof body) => {
      for (const job of jobs) {
        stmt.run(
          job.title, job.company, job.location, job.salary_min || null, job.salary_max || null,
          job.description || '', job.url || '', job.source || '', job.posted_date || '',
          job.match_score || 0, JSON.stringify(job.match_reasons || []), job.role_type || '',
          job.is_remote ? 1 : 0, job.is_sports_tech ? 1 : 0, job.has_apac_exposure ? 1 : 0,
          job.requires_demos ? 1 : 0
        );
      }
    });
    insertMany(body);
    return NextResponse.json({ inserted: body.length });
  }

  const result = db.prepare(`
    INSERT OR IGNORE INTO jobs (title, company, location, salary_min, salary_max, description, url, source, posted_date, match_score, match_reasons, role_type, is_remote, is_sports_tech, has_apac_exposure, requires_demos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.title, body.company, body.location, body.salary_min || null, body.salary_max || null,
    body.description || '', body.url || '', body.source || '', body.posted_date || '',
    body.match_score || 0, JSON.stringify(body.match_reasons || []), body.role_type || '',
    body.is_remote ? 1 : 0, body.is_sports_tech ? 1 : 0, body.has_apac_exposure ? 1 : 0,
    body.requires_demos ? 1 : 0
  );

  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const { id, status } = await req.json();
  db.prepare('UPDATE jobs SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, id);
  return NextResponse.json({ success: true });
}
