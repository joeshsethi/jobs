import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'jobsearch.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      description TEXT,
      url TEXT,
      source TEXT,
      posted_date TEXT,
      match_score INTEGER DEFAULT 0,
      match_reasons TEXT,
      role_type TEXT,
      is_remote INTEGER DEFAULT 0,
      is_sports_tech INTEGER DEFAULT 0,
      has_apac_exposure INTEGER DEFAULT 0,
      requires_demos INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(title, company, url)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'not_applied',
      applied_date TEXT,
      source TEXT,
      contact_name TEXT,
      contact_info TEXT,
      referral INTEGER DEFAULT 0,
      notes TEXT,
      resume_version TEXT,
      cover_letter TEXT,
      follow_up_date TEXT,
      interview_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interview_prep (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      company_research TEXT,
      likely_questions TEXT,
      talking_points TEXT,
      technical_prep TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      query TEXT NOT NULL,
      filters TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON jobs(match_score DESC);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  `);

  // Migrations
  const hasIntel = db.prepare(
    "SELECT name FROM pragma_table_info('interview_prep') WHERE name = 'company_intel'"
  ).get();
  if (!hasIntel) {
    db.exec('ALTER TABLE interview_prep ADD COLUMN company_intel TEXT');
  }
}
