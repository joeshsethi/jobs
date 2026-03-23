'use client';

import { useState } from 'react';
import InterviewPrepPanel from '@/components/InterviewPrepPanel';
import { PROFILE } from '@/lib/profile';

const SUGGESTED_COMPANIES = [
  ...PROFILE.targetCompanies.dreamTier,
  ...PROFILE.targetCompanies.highPriority.slice(0, 5),
  ...PROFILE.targetCompanies.sportsTech.slice(0, 5),
];

export default function InterviewPrepPage() {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Solutions Engineer');
  const [activePrep, setActivePrep] = useState<{ company: string; role: string } | null>(null);

  const startPrep = (c?: string) => {
    const target = c || company;
    if (!target) return;
    setActivePrep({ company: target, role });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Interview Prep</h1>
        <p className="text-gray-400 text-sm">Generate tailored prep for specific companies and roles</p>
      </div>

      {/* Company/Role Selection */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Company name..."
            className="flex-1 min-w-[200px] bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="bg-gray-900 text-gray-300 border border-gray-700 rounded px-3 py-2 text-sm"
          >
            {PROFILE.targetRoles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => startPrep()}
            disabled={!company}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            Generate Prep
          </button>
        </div>

        {/* Quick picks */}
        <div className="mt-3">
          <p className="text-gray-500 text-xs mb-2">Quick pick:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_COMPANIES.map(c => (
              <button
                key={c}
                onClick={() => { setCompany(c); startPrep(c); }}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2.5 py-1 rounded transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Prep */}
      {activePrep ? (
        <InterviewPrepPanel company={activePrep.company} role={activePrep.role} />
      ) : (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <h3 className="text-xl text-gray-500 mb-2">Select a company to start prepping</h3>
          <p className="text-gray-600 text-sm">
            Get tailored interview questions, talking points, and research checklists
          </p>
        </div>
      )}

      {/* Your Differentiators */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3">Your Key Differentiators (use in every interview)</h3>
        <ul className="space-y-2">
          {PROFILE.differentiators.map((d, i) => (
            <li key={i} className="text-gray-300 text-sm pl-4 border-l-2 border-blue-500">{d}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
