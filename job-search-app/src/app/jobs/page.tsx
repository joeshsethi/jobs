'use client';

import { useEffect, useState, useCallback } from 'react';
import JobCard from '@/components/JobCard';
import QuickApplyModal from '@/components/QuickApplyModal';
import { Job } from '@/lib/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ minScore: 0, sportsTech: false, status: 'new' });
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [prepJob, setPrepJob] = useState<Job | null>(null);
  const [manualJob, setManualJob] = useState({ title: '', company: '', location: '', url: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.minScore > 0) params.set('min_score', String(filter.minScore));
    if (filter.sportsTech) params.set('sports_tech', '1');
    if (filter.status !== 'all') params.set('status', filter.status);
    params.set('limit', '100');

    try {
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleStatusChange = async (id: number, status: string) => {
    await fetch('/api/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchJobs();
  };

  const handleApply = async (data: {
    job_id: number; company: string; role: string; source: string;
    contact_name: string; referral: boolean; notes: string; cover_letter: string;
  }) => {
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchJobs();
  };

  const handleAddManualJob = async () => {
    if (!manualJob.title || !manualJob.company) return;
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...manualJob,
        source: 'manual',
        match_score: 50,
        match_reasons: ['Manually added'],
      }),
    });
    setManualJob({ title: '', company: '', location: '', url: '', description: '' });
    setShowAddForm(false);
    fetchJobs();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Discovery</h1>
          <p className="text-gray-400 text-sm">Find and apply to SE/SA roles</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Job Manually
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <h3 className="text-white font-medium mb-3">Add Job Manually</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              placeholder="Job Title *"
              value={manualJob.title}
              onChange={e => setManualJob({ ...manualJob, title: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              placeholder="Company *"
              value={manualJob.company}
              onChange={e => setManualJob({ ...manualJob, company: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              placeholder="Location"
              value={manualJob.location}
              onChange={e => setManualJob({ ...manualJob, location: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              placeholder="URL"
              value={manualJob.url}
              onChange={e => setManualJob({ ...manualJob, url: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <textarea
            placeholder="Job Description (paste for better scoring)"
            value={manualJob.description}
            onChange={e => setManualJob({ ...manualJob, description: e.target.value })}
            className="w-full mt-3 bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm h-20 focus:border-blue-500 focus:outline-none resize-y"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddManualJob} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm">Add & Score</button>
            <button onClick={() => setShowAddForm(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1.5 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filter.status}
          onChange={e => setFilter({ ...filter, status: e.target.value })}
          className="bg-gray-800 text-gray-300 border border-gray-700 rounded px-3 py-2 text-sm"
        >
          <option value="new">New Jobs</option>
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="all">All</option>
        </select>
        <select
          value={filter.minScore}
          onChange={e => setFilter({ ...filter, minScore: parseInt(e.target.value) })}
          className="bg-gray-800 text-gray-300 border border-gray-700 rounded px-3 py-2 text-sm"
        >
          <option value={0}>All Scores</option>
          <option value={20}>20+ Match</option>
          <option value={35}>35+ Match</option>
          <option value={50}>50+ Match</option>
          <option value={60}>60+ Match</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={filter.sportsTech}
            onChange={e => setFilter({ ...filter, sportsTech: e.target.checked })}
            className="rounded"
          />
          Sports Tech Only
        </label>
        <span className="text-gray-500 text-sm ml-auto">{jobs.length} jobs</span>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading jobs...</div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onStatusChange={handleStatusChange}
              onApply={setApplyingJob}
              onPrepInterview={setPrepJob}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No jobs found</p>
          <p className="text-gray-600 text-sm">Run the Python scraper to discover new roles:</p>
          <code className="text-blue-400 text-sm mt-2 block">python scripts/scrape_jobs.py</code>
        </div>
      )}

      {/* Quick Apply Modal */}
      {applyingJob && (
        <QuickApplyModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
