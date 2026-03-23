'use client';

import { useState } from 'react';

interface CoverLetterGeneratorProps {
  company: string;
  role: string;
  jobDescription?: string;
  onGenerated?: (letter: string) => void;
}

export default function CoverLetterGenerator({ company, role, jobDescription, onGenerated }: CoverLetterGeneratorProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, jobDescription }),
      });
      const data = await res.json();
      setCoverLetter(data.coverLetter);
      onGenerated?.(data.coverLetter);
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium">Cover Letter — {company} ({role})</h4>
        <div className="flex gap-2">
          {coverLetter && (
            <button
              onClick={copyToClipboard}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : coverLetter ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>
      {coverLetter ? (
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          className="w-full h-64 bg-gray-900 text-gray-300 text-sm p-3 rounded border border-gray-700 focus:border-blue-500 focus:outline-none resize-y"
        />
      ) : (
        <p className="text-gray-500 text-sm">Click Generate to create a tailored cover letter for this role.</p>
      )}
    </div>
  );
}
