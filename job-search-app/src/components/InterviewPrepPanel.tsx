'use client';

import { useState } from 'react';

interface InterviewPrepPanelProps {
  company: string;
  role: string;
}

interface PrepData {
  companyResearch: {
    company: string;
    isDreamTier: boolean;
    isSportsTech: boolean;
    researchTasks: string[];
  };
  likelyQuestions: Array<{
    question: string;
    guidance: string;
  }>;
  talkingPoints: string[];
  technicalPrep: string[];
}

export default function InterviewPrepPanel({ company, role }: InterviewPrepPanelProps) {
  const [prep, setPrep] = useState<PrepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'talking' | 'research' | 'technical'>('questions');

  const generatePrep = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role }),
      });
      const data = await res.json();
      setPrep(data.prep);
    } catch (err) {
      console.error('Failed to generate prep:', err);
    }
    setLoading(false);
  };

  if (!prep) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Interview Prep: {company}</h3>
        <p className="text-gray-400 mb-4">Generate tailored interview prep for the {role} role</p>
        <button
          onClick={generatePrep}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Prep'}
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'questions' as const, label: 'Likely Questions' },
    { key: 'talking' as const, label: 'Talking Points' },
    { key: 'research' as const, label: 'Company Research' },
    { key: 'technical' as const, label: 'Technical Prep' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">
          Interview Prep: {company} — {role}
        </h3>
        {prep.companyResearch.isDreamTier && (
          <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded mt-1 inline-block">Dream Tier</span>
        )}
        {prep.companyResearch.isSportsTech && (
          <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded mt-1 ml-1 inline-block">Sports Tech</span>
        )}
      </div>

      <div className="flex border-b border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-750'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-h-[500px] overflow-y-auto">
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {prep.likelyQuestions.map((q, i) => (
              <div key={i} className="border border-gray-700 rounded-lg p-3">
                <p className="text-white font-medium mb-2">Q: {q.question}</p>
                <p className="text-gray-400 text-sm">{q.guidance}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'talking' && (
          <ul className="space-y-3">
            {prep.talkingPoints.map((point, i) => (
              <li key={i} className="text-gray-300 pl-4 border-l-2 border-blue-500">
                {point}
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'research' && (
          <div>
            <h4 className="text-white font-medium mb-3">Research Checklist</h4>
            <ul className="space-y-2">
              {prep.companyResearch.researchTasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300">
                  <input type="checkbox" className="mt-1 rounded" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'technical' && (
          <ul className="space-y-2">
            {prep.technicalPrep.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="text-blue-400 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
