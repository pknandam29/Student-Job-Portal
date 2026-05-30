import React, { useState, useEffect } from 'react';
import { Job, User, AppStats } from '../types';
import { 
  Users, Briefcase, FileText, CheckCircle, XCircle, Clock, AlertTriangle, 
  Trash2, ShieldAlert, Star, Shield, HelpCircle, RefreshCw 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<'review-queue' | 'users'>('review-queue');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [actionDone, setActionDone] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchUsers();
    fetchStats();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs?role=Admin');
      const data = await response.json();
      if (response.ok) {
        setJobs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications?role=Admin');
      const data = await response.json();
      if (response.ok) {
        setApplications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setActionDone(`Position was ${newStatus.toLowerCase()} successfully!`);
        fetchJobs();
        fetchStats();
        fetchApplications();
        setTimeout(() => setActionDone(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const purgeUser = async (userId: string) => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you wish to permanently purge this user? This removes their postings and applications instantly.')) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setActionDone('User account and all matching data completely purged.');
        fetchUsers();
        fetchJobs();
        fetchStats();
        fetchApplications();
        setTimeout(() => setActionDone(''), 4000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Purge action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (statusFilter === 'All') return true;
    return j.status === statusFilter;
  });

  return (
    <div className="space-y-6" id="admin-view-root">
      
      {/* Dynamic Activity Feedback */}
      {actionDone && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/50 text-indigo-200 text-xs font-mono rounded-lg flex items-center space-x-1 animate-fadeIn">
          <CheckCircle className="h-4 w-4 text-indigo-400" />
          <span>{actionDone}</span>
        </div>
      )}

      {/* STATISTICS MATRIX BOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-widget-grid">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500">Registered Users</p>
            <h4 className="text-xl font-extrabold text-white">{stats ? stats.totalUsers : '--'}</h4>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-amber-600/10 text-amber-500 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-505 text-amber-400">Awaiting Verify</p>
            <h4 className="text-xl font-extrabold text-white">{stats ? stats.pendingJobs : '--'}</h4>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500 text-emerald-500">Approved Slots</p>
            <h4 className="text-xl font-extrabold text-white">{stats ? stats.approvedJobs : '--'}</h4>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-violet-600/10 text-violet-400 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500">Applications Sent</p>
            <h4 className="text-xl font-extrabold text-white">{stats ? stats.totalApplications : '--'}</h4>
          </div>
        </div>
      </div>

      {/* VISUAL CHARTS BOARD */}
      {(() => {
        const fullTimeJobs = jobs.filter(j => j.jobType === 'Full Time').length;
        const partTimeJobs = jobs.filter(j => j.jobType === 'Part Time').length;
        const internshipJobs = jobs.filter(j => j.jobType === 'Internship').length;
        const remoteJobs = jobs.filter(j => j.jobType === 'Remote').length;
        const totalJobTypes = fullTimeJobs + partTimeJobs + internshipJobs + remoteJobs || 1;

        const appliedCount = applications.filter(a => a.status === 'Applied').length;
        const reviewingCount = applications.filter(a => a.status === 'Reviewing').length;
        const acceptedCount = applications.filter(a => a.status === 'Accepted').length;
        const rejectedCount = applications.filter(a => a.status === 'Rejected').length;
        const totalAppsCount = appliedCount + reviewingCount + acceptedCount + rejectedCount || 1;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn" id="charts-widget-grid">
            {/* Chart 1: Employment Types */}
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4 text-left">
              <div>
                <h4 className="text-xs font-mono uppercase font-bold text-slate-400">Opportunities by Category</h4>
                <p className="text-[10px] text-slate-500 font-medium">Distribution of employment types in active openings</p>
              </div>
              <div className="flex flex-col space-y-3">
                {[
                  { label: 'Full Time', count: fullTimeJobs, fill: '#6366f1' },
                  { label: 'Part Time', count: partTimeJobs, fill: '#f59e0b' },
                  { label: 'Internship', count: internshipJobs, fill: '#10b981' },
                  { label: 'Remote', count: remoteJobs, fill: '#8b5cf6' }
                ].map((item, idx) => {
                  const pct = totalJobTypes > 0 ? (item.count / totalJobTypes) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-350">{item.label}</span>
                        <span className="font-mono text-slate-400">{item.count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${pct}%`, 
                            backgroundColor: item.fill 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Application Pipeline */}
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4 text-left">
              <div>
                <h4 className="text-xs font-mono uppercase font-bold text-slate-400">Application Funnel Outcomes</h4>
                <p className="text-[10px] text-slate-500 font-medium">Status distributions for all student job submissions</p>
              </div>
              <div className="flex flex-col space-y-3">
                {[
                  { label: 'Applied', count: appliedCount, fill: '#3b82f6' },
                  { label: 'Reviewing', count: reviewingCount, fill: '#f59e0b' },
                  { label: 'Accepted', count: acceptedCount, fill: '#10b981' },
                  { label: 'Rejected', count: rejectedCount, fill: '#ef4444' }
                ].map((item, idx) => {
                  const pct = totalAppsCount > 0 ? (item.count / totalAppsCount) * 105 : 0;
                  // Cap pct at 100% just in case
                  const widthPct = Math.min(pct, 100);
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-350">{item.label}</span>
                        <span className="font-mono text-slate-400">{item.count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${widthPct}%`, 
                            backgroundColor: item.fill 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* DASHBOARD LEVEL TABS */}
      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveSubTab('review-queue')}
          className={`pb-3 font-sans font-medium text-sm border-b-2 transition duration-200 cursor-pointer ${
            activeSubTab === 'review-queue' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Verification Desk
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 font-sans font-medium text-sm border-b-2 transition duration-200 cursor-pointer ${
            activeSubTab === 'users' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Site Moderation (Users Panel)
        </button>
      </div>

      {/* TAB SUB-PAGES */}
      
      {/* 1. Job Moderation Desk */}
      {activeSubTab === 'review-queue' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border border-slate-850 bg-slate-900 rounded-xl p-4 gap-3">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 font-bold">
                <ShieldAlert className="h-4 w-4 text-indigo-450" />
                <span>Submitted Placements Log</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Please approve jobs that meet guidelines, or reject spam immediately.</p>
            </div>

            {/* Filter by review state */}
            <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition duration-150 cursor-pointer ${
                    statusFilter === opt 
                      ? 'bg-indigo-650 text-white' 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center h-28 items-center text-xs font-mono text-slate-550">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Synching audit queue log...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-850 py-12 rounded-xl text-center text-slate-550 italic text-xs select-none">
              No entries in {statusFilter} directory right now.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map(job => (
                <div 
                  key={job.id} 
                  className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {job.jobType}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded ${
                          job.status === 'Approved' ? 'bg-emerald-950 text-emerald-450' :
                          job.status === 'Rejected' ? 'bg-rose-955 text-rose-400' :
                          'bg-amber-955 text-amber-500'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white leading-snug">{job.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">@{job.company} &bull; {job.location}</p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <span className="text-[10px] self-center text-slate-500 font-mono">Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                      <div className="flex space-x-1.5">
                        {job.status !== 'Approved' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'Approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition shadow-sm cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {job.status !== 'Rejected' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'Rejected')}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition shadow-sm cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body Details for Review */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-850/60 mt-2">
                      <span className="text-[9px] text-slate-500 uppercase font-mono mr-1 self-center">Skills Targeted:</span>
                      {job.requiredSkills.map((sk, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-750 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contacts panel */}
                  <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-500 font-mono">
                    <span>Contact Info: {job.contactInfo}</span>
                    <span>Salary: {job.salary}</span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. User Moderation directory */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Active Member Directory & Accounts Control
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Provides the ability to purge registered actors and erase spam databases on the portal. Deleting custom roles clears corresponding records.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-850 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Username / Identity</th>
                  <th className="p-4">Primary Email</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4 text-right">Moderations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-850/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                        <span>{u.username}</span>
                        {u.id === 'usr_admin' && <Star className="h-3 w-3 text-amber-450 fill-amber-450" />}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Id: {u.id}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {u.email}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-mono font-bold rounded ${
                        u.role === 'Admin' ? 'bg-indigo-950 text-indigo-400 border border-indigo-905(50)' :
                        u.role === 'Poster' ? 'bg-amber-955 text-amber-500 border border-amber-900/50' :
                        'bg-slate-800 text-slate-300 border border-slate-700/50'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {u.id !== 'usr_admin' ? (
                        <button
                          onClick={() => purgeUser(u.id)}
                          className="p-1.5 hover:bg-rose-950 text-rose-300 hover:text-rose-200 border border-rose-900/60 rounded-md transition duration-150 flex items-center space-x-1 ml-auto cursor-pointer text-xs font-semibold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Purge User</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">System Root</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
