'use client';

import { PROFILE } from '@/lib/profile';

export default function ProfilePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 text-sm">Your job search profile and preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Personal Info</h2>
          <div className="space-y-3 text-sm">
            <InfoRow label="Name" value={PROFILE.name} />
            <InfoRow label="Email" value={PROFILE.email} />
            <InfoRow label="Phone" value={PROFILE.phone} />
            <InfoRow label="Citizenship" value={PROFILE.citizenship.join(', ')} />
            <InfoRow label="Languages" value={PROFILE.skills.languages.join(', ')} />
            <InfoRow label="Locations" value={PROFILE.locations.join(', ') + (PROFILE.openToRemote ? ' + Remote' : '')} />
          </div>
        </div>

        {/* Target Roles */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Target Roles</h2>
          <div className="space-y-2">
            {PROFILE.targetRoles.map((role, i) => (
              <div key={role} className="flex items-center gap-2">
                <span className="text-blue-400 text-sm font-mono">#{i + 1}</span>
                <span className="text-gray-300 text-sm">{role}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs">Compensation</p>
            <p className="text-gray-300 text-sm">Preferred: ${(PROFILE.compensation.preferred.min / 1000).toFixed(0)}K+ ({PROFILE.compensation.preferred.note})</p>
            <p className="text-gray-300 text-sm">Entry: ${(PROFILE.compensation.entryLevel.min / 1000).toFixed(0)}K-${(PROFILE.compensation.entryLevel.max / 1000).toFixed(0)}K ({PROFILE.compensation.entryLevel.note})</p>
          </div>
        </div>

        {/* Key Experience */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Key Projects</h2>
          <div className="space-y-4">
            {PROFILE.experience.keyProjects.map((project) => (
              <div key={project.name} className="border-l-2 border-blue-500 pl-3">
                <p className="text-white text-sm font-medium">{project.name}</p>
                <p className="text-blue-400 text-xs">{project.tech}</p>
                <p className="text-gray-500 text-xs">{project.impact}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Differentiators */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Key Differentiators</h2>
          <ul className="space-y-2">
            {PROFILE.differentiators.map((d, i) => (
              <li key={i} className="text-gray-300 text-sm pl-4 border-l-2 border-green-500">{d}</li>
            ))}
          </ul>

          <h3 className="text-white font-medium mt-6 mb-3">Technical Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {PROFILE.skills.technical.map(skill => (
              <span key={skill} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{skill}</span>
            ))}
          </div>

          <h3 className="text-white font-medium mt-4 mb-3">Pre-Sales Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {PROFILE.skills.preSales.map(skill => (
              <span key={skill} className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">{skill}</span>
            ))}
          </div>
        </div>

        {/* Target Companies */}
        <div className="bg-gray-800 rounded-lg p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Target Companies</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-yellow-400 text-sm font-medium mb-2">Dream Tier</h3>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE.targetCompanies.dreamTier.map(c => (
                  <span key={c} className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">{c}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-blue-400 text-sm font-medium mb-2">High Priority</h3>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE.targetCompanies.highPriority.map(c => (
                  <span key={c} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">{c}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-purple-400 text-sm font-medium mb-2">Sports Tech</h3>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE.targetCompanies.sportsTech.map(c => (
                  <span key={c} className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-gray-800 rounded-lg p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Exclusions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-red-400 text-sm font-medium mb-2">Excluded Roles</h3>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE.excludeRoles.map(r => (
                  <span key={r} className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">{r}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-red-400 text-sm font-medium mb-2">Excluded Industries</h3>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE.excludeIndustries.map(i => (
                  <span key={i} className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">{i}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
