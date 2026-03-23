'use client';

import { useState, useRef } from 'react';

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
  likelyQuestions: Array<{ question: string; guidance: string }>;
  talkingPoints: string[];
  technicalPrep: string[];
}

interface IntelSection {
  title: string;
  content: string;
}

function parseIntelSections(text: string): IntelSection[] {
  const sections: IntelSection[] = [];
  const lines = text.split('\n');
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
      }
      currentTitle = line.slice(3).trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }
  return sections;
}

const SECTION_ICONS: Record<string, string> = {
  'What They Do': '🏢',
  'Products & Services': '📦',
  'Growth Story': '📈',
  'How They Make Money': '💰',
  'Goals & Strategy': '🎯',
  'Social & ESG Goals': '🌱',
  'Competitive Landscape': '⚔️',
  'Interview Angles for Joesh': '✨',
};

export default function InterviewPrepPanel({ company, role }: InterviewPrepPanelProps) {
  const [prep, setPrep] = useState<PrepData | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);

  const [intelText, setIntelText] = useState('');
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelDone, setIntelDone] = useState(false);
  const [intelFromCache, setIntelFromCache] = useState(false);

  const [activeTab, setActiveTab] = useState<'intel' | 'questions' | 'talking' | 'technical'>('intel');
  const abortRef = useRef<AbortController | null>(null);

  const generatePrep = async () => {
    setPrepLoading(true);
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
    setPrepLoading(false);
  };

  const fetchIntel = async () => {
    if (intelLoading || (intelDone && intelText)) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIntelText('');
    setIntelLoading(true);
    setIntelDone(false);

    try {
      const res = await fetch('/api/company-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
        signal: controller.signal,
      });

      setIntelFromCache(res.headers.get('X-Cache') === 'HIT');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setIntelText(prev => prev + chunk);
      }

      setIntelDone(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Intel fetch error:', err);
        setIntelText(prev => prev + '\n\n[Research interrupted. Try refreshing.]');
      }
    }
    setIntelLoading(false);
  };

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'intel') fetchIntel();
  };

  const handleGenerate = () => {
    generatePrep();
    fetchIntel();
  };

  const refreshIntel = async () => {
    // Clear cache then re-fetch
    await fetch('/api/company-intel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company }),
    });
    setIntelText('');
    setIntelDone(false);
    setIntelFromCache(false);
    fetchIntel();
  };

  if (!prep && !intelText && !intelLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Interview Prep: {company}</h3>
        <p className="text-gray-400 mb-4 text-sm">
          Get deep company research + tailored interview prep for the {role} role
        </p>
        <button
          onClick={handleGenerate}
          disabled={prepLoading}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          Generate Prep
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'intel' as const, label: 'Company Intel' },
    { key: 'questions' as const, label: 'Likely Questions' },
    { key: 'talking' as const, label: 'Talking Points' },
    { key: 'technical' as const, label: 'Technical Prep' },
  ];

  const intelSections = parseIntelSections(intelText);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {company} — {role}
          </h3>
          {prep?.companyResearch.isDreamTier && (
            <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded mr-1">Dream Tier</span>
          )}
          {prep?.companyResearch.isSportsTech && (
            <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">Sports Tech</span>
          )}
        </div>
        {intelDone && intelFromCache && (
          <button
            onClick={refreshIntel}
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
            title="Re-research this company"
          >
            ↺ Refresh research
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.key === 'intel' && intelLoading && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">

        {/* Company Intel Tab */}
        {activeTab === 'intel' && (
          <div>
            {!intelText && !intelLoading && (
              <div className="text-center py-8">
                <button
                  onClick={fetchIntel}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  Research {company}
                </button>
              </div>
            )}

            {intelLoading && !intelText && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm mb-2">
                  Claude is searching the web for {company}...
                </div>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stream in raw text while sections are incomplete */}
            {intelText && !intelDone && intelSections.length < 2 && (
              <div className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {intelText}
                <span className="inline-block w-2 h-4 bg-blue-400 ml-0.5 animate-pulse align-text-bottom" />
              </div>
            )}

            {/* Render parsed sections */}
            {(intelDone || intelSections.length >= 2) && intelSections.length > 0 && (
              <div className="space-y-4">
                {intelFromCache && (
                  <p className="text-xs text-gray-600 italic">Loaded from cache — click ↺ to refresh</p>
                )}
                {intelSections.map((section, i) => (
                  <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-750 px-4 py-2.5 border-b border-gray-700 flex items-center gap-2">
                      <span>{SECTION_ICONS[section.title] ?? '📌'}</span>
                      <h4 className="text-white font-semibold text-sm">{section.title}</h4>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {section.content}
                        {!intelDone && i === intelSections.length - 1 && (
                          <span className="inline-block w-2 h-4 bg-blue-400 ml-0.5 animate-pulse align-text-bottom" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Likely Questions Tab */}
        {activeTab === 'questions' && (
          <div>
            {!prep ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {prepLoading ? 'Loading questions...' : 'Generate prep to see interview questions.'}
              </div>
            ) : (
              <div className="space-y-4">
                {prep.likelyQuestions.map((q, i) => (
                  <div key={i} className="border border-gray-700 rounded-lg p-3">
                    <p className="text-white font-medium mb-2">Q: {q.question}</p>
                    <p className="text-gray-400 text-sm">{q.guidance}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Talking Points Tab */}
        {activeTab === 'talking' && (
          <div>
            {!prep ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {prepLoading ? 'Loading...' : 'Generate prep to see talking points.'}
              </div>
            ) : (
              <ul className="space-y-3">
                {prep.talkingPoints.map((point, i) => (
                  <li key={i} className="text-gray-300 pl-4 border-l-2 border-blue-500 text-sm">
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Technical Prep Tab */}
        {activeTab === 'technical' && (
          <div>
            {!prep ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {prepLoading ? 'Loading...' : 'Generate prep to see technical prep items.'}
              </div>
            ) : (
              <ul className="space-y-2">
                {prep.technicalPrep.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
