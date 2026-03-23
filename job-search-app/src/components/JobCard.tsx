'use client';

import { Job } from '@/lib/types';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  onStatusChange: (id: number, status: string) => void;
  onApply: (job: Job) => void;
  onPrepInterview: (job: Job) => void;
}

export default function JobCard({ job, onStatusChange, onApply, onPrepInterview }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const reasons = (() => {
    try { return JSON.parse(job.match_reasons || '[]'); } catch { return []; }
  })();

  const scoreColor = job.match_score >= 60 ? 'text-green-400 border-green-500' :
    job.match_score >= 35 ? 'text-yellow-400 border-yellow-500' :
    'text-gray-400 border-gray-500';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{job.title}</h3>
            {job.is_sports_tech === 1 && (
              <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">Sports Tech</span>
            )}
            {job.has_apac_exposure === 1 && (
              <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded">APAC</span>
            )}
            {job.is_remote === 1 && (
              <span className="text-xs bg-teal-900 text-teal-300 px-2 py-0.5 rounded">Remote</span>
            )}
          </div>
          <p className="text-blue-400 font-medium">{job.company}</p>
          <p className="text-gray-400 text-sm">{job.location}</p>
          {(job.salary_min || job.salary_max) && (
            <p className="text-gray-400 text-sm">
              {job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}K` : ''}
              {job.salary_min && job.salary_max ? ' - ' : ''}
              {job.salary_max ? `$${(job.salary_max / 1000).toFixed(0)}K` : ''}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">via {job.source} {job.posted_date ? `· ${job.posted_date}` : ''}</p>
        </div>
        <div className={`text-center border-2 rounded-lg px-3 py-2 ${scoreColor}`}>
          <div className="text-2xl font-bold">{job.match_score}</div>
          <div className="text-xs">Match</div>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {reasons.map((reason: string, i: number) => (
            <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              {reason}
            </span>
          ))}
        </div>
      )}

      {expanded && job.description && (
        <div className="mt-3 text-sm text-gray-400 border-t border-gray-700 pt-3 max-h-48 overflow-y-auto">
          {job.description.substring(0, 500)}{job.description.length > 500 ? '...' : ''}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors"
          >
            View Posting
          </a>
        )}
        <button
          onClick={() => onApply(job)}
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
        >
          Quick Apply
        </button>
        <button
          onClick={() => onPrepInterview(job)}
          className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors"
        >
          Prep Interview
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 transition-colors"
        >
          {expanded ? 'Less' : 'More'}
        </button>
        <div className="ml-auto flex gap-1">
          {job.status !== 'saved' && (
            <button
              onClick={() => onStatusChange(job.id, 'saved')}
              className="text-xs text-gray-500 hover:text-yellow-400 px-2 py-1"
            >
              Save
            </button>
          )}
          <button
            onClick={() => onStatusChange(job.id, 'hidden')}
            className="text-xs text-gray-500 hover:text-red-400 px-2 py-1"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}
