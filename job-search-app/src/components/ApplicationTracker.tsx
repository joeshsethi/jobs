'use client';

import { Application } from '@/lib/types';

interface ApplicationTrackerProps {
  applications: Application[];
  onStatusChange: (id: number, status: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  not_applied: 'bg-gray-700 text-gray-300',
  applied: 'bg-blue-900 text-blue-300',
  referral_sent: 'bg-indigo-900 text-indigo-300',
  phone_screen: 'bg-yellow-900 text-yellow-300',
  interview_scheduled: 'bg-orange-900 text-orange-300',
  interviewed: 'bg-purple-900 text-purple-300',
  offer: 'bg-green-900 text-green-300',
  rejected: 'bg-red-900 text-red-300',
  withdrawn: 'bg-gray-800 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  not_applied: 'Not Applied',
  applied: 'Applied',
  referral_sent: 'Referral Sent',
  phone_screen: 'Phone Screen',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export default function ApplicationTracker({ applications, onStatusChange }: ApplicationTrackerProps) {
  const statuses = Object.keys(STATUS_LABELS);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Company</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Applied</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Source</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Referral</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 px-4 text-white font-medium">{app.company}</td>
              <td className="py-3 px-4 text-gray-300">{app.role}</td>
              <td className="py-3 px-4">
                <select
                  value={app.status}
                  onChange={(e) => onStatusChange(app.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${STATUS_COLORS[app.status] || 'bg-gray-700 text-gray-300'}`}
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4 text-gray-400">{app.applied_date || '-'}</td>
              <td className="py-3 px-4 text-gray-400">{app.source || '-'}</td>
              <td className="py-3 px-4">
                {app.referral ? (
                  <span className="text-green-400 text-xs">Yes{app.contact_name ? ` (${app.contact_name})` : ''}</span>
                ) : (
                  <span className="text-gray-600 text-xs">Cold</span>
                )}
              </td>
              <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">{app.notes || '-'}</td>
            </tr>
          ))}
          {applications.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-500">
                No applications yet. Start applying from the Job Discovery page.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
