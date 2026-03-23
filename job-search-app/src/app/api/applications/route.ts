import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const applications = db.prepare(`
    SELECT a.*, j.match_score, j.url as job_url
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    ORDER BY a.updated_at DESC
  `).all();
  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  const result = db.prepare(`
    INSERT INTO applications (job_id, company, role, status, applied_date, source, contact_name, contact_info, referral, notes, resume_version, cover_letter)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.job_id || null, body.company, body.role,
    body.status || 'applied', body.applied_date || new Date().toISOString().split('T')[0],
    body.source || '', body.contact_name || '', body.contact_info || '',
    body.referral ? 1 : 0, body.notes || '', body.resume_version || 'v2_se_focused',
    body.cover_letter || ''
  );

  // Update job status if linked
  if (body.job_id) {
    db.prepare('UPDATE jobs SET status = "applied", updated_at = datetime("now") WHERE id = ?').run(body.job_id);
  }

  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, ...updates } = body;

  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  db.prepare(`UPDATE applications SET ${setClause}, updated_at = datetime("now") WHERE id = ?`).run(...values, id);

  return NextResponse.json({ success: true });
}
