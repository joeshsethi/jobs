export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  url: string;
  source: string;
  posted_date: string;
  match_score: number;
  match_reasons: string;
  role_type: string;
  is_remote: number;
  is_sports_tech: number;
  has_apac_exposure: number;
  requires_demos: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  job_id: number | null;
  company: string;
  role: string;
  status: string;
  applied_date: string | null;
  source: string;
  contact_name: string;
  contact_info: string;
  referral: number;
  notes: string;
  resume_version: string;
  cover_letter: string;
  follow_up_date: string | null;
  interview_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewPrep {
  id: number;
  application_id: number;
  company: string;
  role: string;
  company_research: string;
  likely_questions: string;
  talking_points: string;
  technical_prep: string;
  created_at: string;
}

export type ApplicationStatus =
  | 'not_applied'
  | 'applied'
  | 'referral_sent'
  | 'phone_screen'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export type JobStatus = 'new' | 'saved' | 'applied' | 'hidden';
