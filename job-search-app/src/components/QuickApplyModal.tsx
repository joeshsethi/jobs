'use client';

import { useState } from 'react';
import { Job } from '@/lib/types';
import CoverLetterGenerator from './CoverLetterGenerator';

interface QuickApplyModalProps {
  job: Job;
  onClose: () => void;
  onApply: (data: {
    job_id: number;
    company: string;
    role: string;
    source: string;
    contact_name: string;
    referral: boolean;
    notes: string;
    cover_letter: string;
  }) => void;
}

export default function QuickApplyModal({ job, onClose, onApply }: QuickApplyModalProps) {
  const [contactName, setContactName] = useState('');
  const [isReferral, setIsReferral] = useState(false);
  const [notes, setNotes] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const handleSubmit = () => {
    onApply({
      job_id: job.id,
      company: job.company,
      role: job.title,
      source: job.source || 'direct',
      contact_name: contactName,
      referral: isReferral,
      notes,
      cover_letter: coverLetter,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{job.title}</h2>
              <p className="text-blue-400">{job.company}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-2xl">&times;</button>
          </div>

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 underline block mb-4"
            >
              Open job posting in new tab to apply
            </a>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contact / Referral Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g., Grace Stuart"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={isReferral}
                onChange={(e) => setIsReferral(e.target.checked)}
                className="rounded"
              />
              This is a referral / internal connection
            </label>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this application..."
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm h-20 focus:border-blue-500 focus:outline-none resize-y"
              />
            </div>

            <button
              onClick={() => setShowCoverLetter(!showCoverLetter)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showCoverLetter ? 'Hide cover letter generator' : 'Generate cover letter'}
            </button>

            {showCoverLetter && (
              <CoverLetterGenerator
                company={job.company}
                role={job.title}
                jobDescription={job.description}
                onGenerated={setCoverLetter}
              />
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Mark as Applied
              </button>
              <button
                onClick={onClose}
                className="px-6 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
