'use client';

import { useEffect, useState } from 'react';
import ApplicationTracker from '@/components/ApplicationTracker';
import { Application } from '@/lib/types';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApp, setNewApp] = useState({
    company: '', role: '', source: '', contact_name: '', referral: false, notes: '',
  });

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleStatusChange = async (id: number, status: string) => {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchApplications();
  };

  const handleAddApp = async () => {
    if (!newApp.company || !newApp.role) return;
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newApp,
        status: 'applied',
        applied_date: new Date().toISOString().split('T')[0],
      }),
    });
    setNewApp({ company: '', role: '', source: '', contact_name: '', referral: false, notes: '' });
    setShowAddForm(false);
    fetchApplications();
  };

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Tracker</h1>
          <p className="text-gray-400 text-sm">{applications.length} total applications</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Application
        </button>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-full">
            {status.replace(/_/g, ' ')}: {count}
          </span>
        ))}
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <h3 className="text-white font-medium mb-3">Add Application</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              placeholder="Company *"
              value={newApp.company}
              onChange={e => setNewApp({ ...newApp, company: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              placeholder="Role *"
              value={newApp.role}
              onChange={e => setNewApp({ ...newApp, role: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              placeholder="Source (LinkedIn, referral, etc.)"
              value={newApp.source}
              onChange={e => setNewApp({ ...newApp, source: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              placeholder="Contact Name"
              value={newApp.contact_name}
              onChange={e => setNewApp({ ...newApp, contact_name: e.target.value })}
              className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 mt-3">
            <input
              type="checkbox"
              checked={newApp.referral}
              onChange={e => setNewApp({ ...newApp, referral: e.target.checked })}
            />
            Referral / Internal Connection
          </label>
          <textarea
            placeholder="Notes"
            value={newApp.notes}
            onChange={e => setNewApp({ ...newApp, notes: e.target.value })}
            className="w-full mt-3 bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm h-16 focus:border-blue-500 focus:outline-none resize-y"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddApp} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm">Add</button>
            <button onClick={() => setShowAddForm(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1.5 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <ApplicationTracker applications={applications} onStatusChange={handleStatusChange} />
        )}
      </div>
    </div>
  );
}
