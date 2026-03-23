'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalJobs: number;
  newJobs: number;
  savedJobs: number;
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  topMatches: Array<{ id: number; title: string; company: string; match_score: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0, newJobs: 0, savedJobs: 0,
    totalApplications: 0, activeApplications: 0, interviews: 0,
    topMatches: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          fetch('/api/jobs?limit=5&min_score=30'),
          fetch('/api/applications'),
        ]);
        const jobsData = await jobsRes.json();
        const appsData = await appsRes.json();

        const apps = appsData.applications || [];
        setStats({
          totalJobs: jobsData.total || 0,
          newJobs: (jobsData.jobs || []).filter((j: { status: string }) => j.status === 'new').length,
          savedJobs: (jobsData.jobs || []).filter((j: { status: string }) => j.status === 'saved').length,
          totalApplications: apps.length,
          activeApplications: apps.filter((a: { status: string }) =>
            !['rejected', 'withdrawn'].includes(a.status)).length,
          interviews: apps.filter((a: { status: string }) =>
            ['interview_scheduled', 'interviewed', 'phone_screen'].includes(a.status)).length,
          topMatches: (jobsData.jobs || []).slice(0, 5),
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome back, Joesh</h1>
        <p className="text-gray-400 mt-1">Your job search dashboard — Solutions Engineer track</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Jobs Found" value={stats.totalJobs} color="blue" />
        <StatCard label="Applications" value={stats.totalApplications} color="green" />
        <StatCard label="Active" value={stats.activeApplications} color="yellow" />
        <StatCard label="Interviews" value={stats.interviews} color="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/jobs" className="flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-colors">
              <span className="text-gray-200">Browse & Apply to Jobs</span>
              <span className="text-blue-400">→</span>
            </Link>
            <Link href="/interview-prep" className="flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-colors">
              <span className="text-gray-200">Prep for Interview</span>
              <span className="text-purple-400">→</span>
            </Link>
            <Link href="/applications" className="flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-colors">
              <span className="text-gray-200">Track Applications</span>
              <span className="text-green-400">→</span>
            </Link>
            <div className="bg-gray-700 rounded-lg p-3">
              <span className="text-gray-200">Run Job Scraper</span>
              <p className="text-gray-500 text-xs mt-1">python scripts/scrape_jobs.py</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Matches</h2>
          {stats.topMatches.length > 0 ? (
            <div className="space-y-2">
              {stats.topMatches.map((job) => (
                <div key={job.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{job.title}</p>
                    <p className="text-blue-400 text-xs">{job.company}</p>
                  </div>
                  <span className={`text-sm font-bold ${
                    job.match_score >= 60 ? 'text-green-400' :
                    job.match_score >= 35 ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {job.match_score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No jobs yet</p>
              <p className="text-gray-600 text-sm">Run the scraper or add jobs manually to get started</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Workflow</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <WorkflowStep step={1} title="Discover" desc="Run scraper to find new SE/SA roles across job boards" />
          <WorkflowStep step={2} title="Review & Apply" desc="Score matches, generate cover letters, track applications" />
          <WorkflowStep step={3} title="Prep" desc="Generate interview prep when you land callbacks" />
          <WorkflowStep step={4} title="Follow Up" desc="Track application status and schedule follow-ups" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-500 text-blue-400',
    green: 'border-green-500 text-green-400',
    yellow: 'border-yellow-500 text-yellow-400',
    purple: 'border-purple-500 text-purple-400',
  };
  return (
    <div className={`bg-gray-800 border-l-4 ${colorClasses[color]} rounded-lg p-4`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

function WorkflowStep({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 font-bold">
        {step}
      </div>
      <h3 className="text-white font-medium">{title}</h3>
      <p className="text-gray-500 text-xs mt-1">{desc}</p>
    </div>
  );
}
