import React, { useState, useEffect } from 'react';
import { Job, StudentProfile, Application, ChatMessage } from '../types';
import AIResumeReview from './AIResumeReview';
import { 
  Building, MapPin, DollarSign, Calendar, Search, Filter, 
  Send, Server, CheckCircle, FileText, AlertCircle, MessageSquare, 
  MessageCircle, Sparkles, X, RefreshCw, UserCheck, Bookmark
} from 'lucide-react';

const renderTimeline = (status: string) => {
  const steps = [
    { label: 'Applied', isActive: true, isCompleted: true },
    { label: 'Reviewing', isActive: status !== 'Applied', isCompleted: status === 'Accepted' || status === 'Rejected' },
    { 
      label: status === 'Rejected' ? 'Rejected' : 'Decision', 
      isActive: status === 'Accepted' || status === 'Rejected', 
      isCompleted: status === 'Accepted' || status === 'Rejected',
      isError: status === 'Rejected'
    }
  ];
  return (
    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 mt-2">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex items-center space-x-1">
            <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
              step.isCompleted 
                ? (step.isError ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white')
                : (step.isActive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400')
            }`}>
              {step.isCompleted ? (step.isError ? '✗' : '✓') : (idx + 1)}
            </div>
            <span className={`text-[10px] font-bold ${
              step.isCompleted 
                ? (step.isError ? 'text-rose-600' : 'text-emerald-600')
                : (step.isActive ? 'text-indigo-600' : 'text-slate-450 text-slate-450')
            }`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`h-0.5 w-6 ${
              steps[idx+1].isActive ? 'bg-indigo-600' : 'bg-slate-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface StudentDashboardProps {
  studentId: string;
  studentProfile: StudentProfile | null;
  onRefreshProfile: () => void;
}

export default function StudentDashboard({ studentId, studentProfile, onRefreshProfile }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'ai-review'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterSkill, setFilterSkill] = useState<string>('');

  // Selected Job for Detailed Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [customResume, setCustomResume] = useState('');

  // Chat with Recruiter State
  const [activeChatApp, setActiveChatApp] = useState<Application | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Saved Jobs & Screening Answers State
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [screeningAnswers, setScreeningAnswers] = useState<string[]>([]);

  const toggleSaveJob = async (jobId: string) => {
    if (!studentProfile) return;
    const currentSaved = studentProfile.savedJobs || [];
    let newSaved: string[];
    if (currentSaved.includes(jobId)) {
      newSaved = currentSaved.filter(id => id !== jobId);
    } else {
      newSaved = [...currentSaved, jobId];
    }
    try {
      const response = await fetch(`/api/student/profile/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentProfile,
          savedJobs: newSaved,
        }),
      });
      if (response.ok) {
        onRefreshProfile();
      }
    } catch (err) {
      console.error('Error toggling saved job', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [studentId]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs?role=Student');
      const data = await response.json();
      if (response.ok) {
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/applications?role=Student&userId=${studentId}`);
      const data = await response.json();
      if (response.ok) {
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications', err);
    }
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    try {
      const resumeToSend = customResume || (studentProfile ? studentProfile.resumeText : '');
      const answersPayload = selectedJob.screeningQuestions?.map((q, idx) => ({
        question: q,
        answer: screeningAnswers[idx] || '',
      })) || [];

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          studentId,
          resumeText: resumeToSend,
          answers: answersPayload,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: 'Application successfully completed! The recruiter has been notified.', type: 'success' });
        setShowApplyModal(false);
        fetchApplications();
        // Clear message after 4s
        setTimeout(() => setMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to submit application.');
      }
    } catch (err) {
      console.error('Error submitting application', err);
    }
  };

  // Chat Engine Functions
  const openChatForApplication = async (app: Application) => {
    setActiveChatApp(app);
    setChatMessages([]);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/chats?applicationId=${app.id}`);
      const data = await res.json();
      if (res.ok) {
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages', err);
    } finally {
      setChatLoading(false);
    }
  };

  // Poll for new messages every 5 seconds if chat pane is open
  useEffect(() => {
    if (!activeChatApp) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats?applicationId=${activeChatApp.id}`);
        const data = await res.json();
        if (res.ok) {
          setChatMessages(data);
        }
      } catch (err) {
        console.error('Error polling chats', err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChatApp]);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !activeChatApp) return;

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: activeChatApp.jobId,
          applicationId: activeChatApp.id,
          senderId: studentId,
          senderRole: 'Student',
          senderName: studentProfile?.name || 'Student',
          message: newMsgText,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages(prev => [...prev, data]);
        setNewMsgText('');
      }
    } catch (err) {
      console.error('Error sending chat message', err);
    }
  };

  // Extract unique locations and skills for clean filtering dropdowns
  const uniqueLocations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));
  const uniqueSkills = Array.from(
    new Set(jobs.flatMap(j => j.requiredSkills || []).map(s => s.toLowerCase()).filter(Boolean))
  ) as string[];

  // Apply visual search filters
  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase();
    const titleMatch = job.title.toLowerCase().includes(query);
    const companyMatch = job.company.toLowerCase().includes(query);
    const descMatch = job.description.toLowerCase().includes(query);
    const matchesKeyword = titleMatch || companyMatch || descMatch;

    const matchesType = !filterType || job.jobType === filterType;
    const matchesLocation = !filterLocation || job.location === filterLocation;
    const matchesSkill = !filterSkill || (job.requiredSkills || []).some(s => s.toLowerCase() === filterSkill.toLowerCase());
    const matchesSaved = !showSavedOnly || (studentProfile?.savedJobs || []).includes(job.id);

    return matchesKeyword && matchesType && matchesLocation && matchesSkill && matchesSaved;
  });

  return (
    <div className="space-y-6" id="student-view-container">
      
      {/* Alert Messaging banner */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold border flex items-center space-x-2 animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
            : 'bg-rose-50 border-rose-250 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-650" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs Menu bar */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 font-sans font-bold text-sm border-b-2 transition duration-200 cursor-pointer ${
            activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Explore Verified Opportunities
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 font-sans font-bold text-sm border-b-2 transition duration-200 cursor-pointer relative ${
            activeTab === 'applications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Applications
          {applications.length > 0 && (
            <span className="absolute -top-1.5 -right-3.5 bg-indigo-600 text-[10px] text-white px-1.5 py-0.5 rounded-full font-mono font-bold leading-none">
              {applications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ai-review')}
          className={`pb-3 font-sans font-bold text-sm border-b-2 transition duration-200 cursor-pointer flex items-center space-x-1 ${
            activeTab === 'ai-review' ? 'border-indigo-605 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>AI Resume Reviewer</span>
        </button>
      </div>

      {/* TAB CONTENTS */}

      {/* 1. Exploration Mode */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Filter Bar Grid */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center animate-fadeIn">
            {/* Query */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search titles, companies, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition font-medium"
              />
            </div>

            {/* Type */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-4 w-4 text-slate-400" />
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition font-medium cursor-pointer"
              >
                <option value="">All Employment Types</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            {/* Location */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <MapPin className="h-4 w-4 text-slate-400" />
              </span>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-605 focus:outline-none transition font-medium cursor-pointer"
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((loc, i) => (
                  <option key={i} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Required Skills */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Sparkles className="h-4 w-4 text-slate-400" />
              </span>
              <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-605 focus:outline-none transition font-medium cursor-pointer"
              >
                <option value="">All Skill Tags</option>
                {uniqueSkills.map((sk, i) => (
                  <option key={i} value={sk}>{sk.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Saved Opportunities Sub-Bar */}
          <div className="flex justify-end animate-fadeIn">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 border transition cursor-pointer ${
                showSavedOnly 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${showSavedOnly ? 'fill-indigo-650 text-indigo-650' : 'text-slate-400'}`} />
              <span>Saved Opportunities Only ({studentProfile?.savedJobs?.length || 0})</span>
            </button>
          </div>

          {/* Job Postings Grid */}
          {loading ? (
            <div className="flex flex-col h-40 justify-center items-center text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mb-2 text-indigo-600" />
              <span className="text-xs">Fetching verified jobs...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 py-16 text-center text-slate-500 rounded-xl">
              <Building className="h-12 w-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-800">No approved matching vacancies found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Administrators confirm each submitted opportunity before publication. Try adjusting filters or searching general keywords!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(job => {
                const alreadyApplied = applications.some(a => a.jobId === job.id);
                return (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200/80 hover:border-indigo-500/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {job.jobType}
                          </span>
                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            className="p-1 text-slate-400 hover:text-amber-505 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Save Job"
                          >
                            <Bookmark className={`h-4 w-4 ${studentProfile?.savedJobs?.includes(job.id) ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 font-medium">
                          Due: {job.deadline}
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 tracking-tight leading-tight">{job.title}</h4>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{job.company}</span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-3 pt-2 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="flex items-center space-x-1 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-slate-900 font-bold">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{job.salary}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.map((sk, id) => (
                          <span key={id} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold border border-slate-150">
                            {sk}
                          </span>
                        ))}
                      </div>

                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="w-1/2 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition cursor-pointer text-center"
                        >
                          View Details
                        </button>
                        {alreadyApplied ? (
                          <span className="w-1/2 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 select-none">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            <span>Applied</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowApplyModal(true);
                              setCustomResume(studentProfile ? studentProfile.resumeText : '');
                              setScreeningAnswers(job.screeningQuestions ? new Array(job.screeningQuestions.length).fill('') : []);
                            }}
                            className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-705 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer text-center"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. My Applications Tracking Mode */}
      {activeTab === 'applications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* List of Applications */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-500 uppercase mb-2">
              Submitted Applications History
            </h3>
            {applications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No jobs applied for yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Explore active job listings in the dashboard and tap "Apply".</p>
              </div>
            ) : (
              applications.map(app => (
                <div 
                  key={app.id} 
                  className={`bg-white border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-200 shadow-sm ${
                    activeChatApp?.id === app.id ? 'border-indigo-600 ring-2 ring-indigo-500/15' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{app.job?.title || 'Unknown Role'}</h4>
                      <span className="text-xs text-slate-500 font-semibold font-sans">@ {app.job?.company}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <span>Type: {app.job?.jobType}</span>
                    </div>
                    {/* Stepper timeline */}
                    {renderTimeline(app.status)}
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Visual Status Indicator Badge */}
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-mono font-bold rounded-full border ${
                      app.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                      app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      app.status === 'Reviewing' ? 'bg-amber-50 text-amber-850 border-amber-250' :
                      'bg-slate-100 text-slate-600 border-slate-205'
                    }`}>
                      {app.status}
                    </span>

                    <button
                      onClick={() => openChatForApplication(app)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-150 text-xs font-bold text-slate-600 hover:text-indigo-650 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Chat with Poster</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Connected Chats Pane */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between h-[450px] overflow-hidden">
            {activeChatApp ? (
              <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 max-w-[170px] truncate">
                      Chat: {activeChatApp.job?.company}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                      {activeChatApp.job?.title} Role
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveChatApp(null)} 
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                  {chatLoading ? (
                    <div className="m-auto text-xs text-slate-405 flex items-center space-x-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Syncing thread...</span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="m-auto text-center p-4">
                      <MessageCircle className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                      <p className="text-[11px] text-slate-500 font-bold">No messages in this chat yet.</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Send a greeting message to introduce yourself!</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMe = msg.senderId === studentId;
                      return (
                        <div key={msg.id} className={`max-w-[85%] flex flex-col space-y-0.5 ${
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        }`}>
                          <span className="text-[8px] font-mono font-bold text-slate-400">{msg.senderName}</span>
                          <div className={`p-2.5 rounded-xl text-xs ${
                            isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[8px] font-mono text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Send Input */}
                <form onSubmit={sendChatMessage} className="p-3 bg-slate-50 border-t border-slate-200 flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="Type your message..."
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 text-slate-850 placeholder-slate-405 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600"
                  />
                  <button 
                    type="submit" 
                    className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-705 rounded-lg transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="m-auto text-center p-6 space-y-2 text-slate-400">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Recruiter Chat Sandbox</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Click on <strong>"Chat with Poster"</strong> in your application history list to establish instant communication with the company representative.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AI Resume Audit widget component */}
      {activeTab === 'ai-review' && (
        <AIResumeReview 
          resumeText={studentProfile?.resumeText || ''} 
          studentSkills={studentProfile?.skills || []}
          jobs={jobs}
        />
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn" id="job-detail-modal">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-205">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                  {selectedJob.jobType}
                </span>
                <h3 className="text-md font-bold text-slate-900 mt-1">{selectedJob.title}</h3>
                <p className="text-xs text-slate-550 font-medium">@{selectedJob.company} &bull; {selectedJob.location}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedJob(null);
                  setShowApplyModal(false);
                }} 
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto text-xs text-slate-700">
              {!showApplyModal ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">Estimated Salary / Stipend</p>
                      <p className="text-sm font-bold text-emerald-600 flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-emerald-605" />
                        <span>{selectedJob.salary}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">Application Deadline</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{selectedJob.deadline}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800">Full Description:</h5>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{selectedJob.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-800">Required Skills & Capabilities:</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.requiredSkills.map((sk, i) => (
                        <span key={i} className="text-xs bg-slate-150 bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-205 font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-100">
                    <p className="text-[10px] uppercase font-mono font-bold text-indigo-750">Poster Contact Information</p>
                    <p className="text-xs font-bold text-indigo-900">{selectedJob.contactInfo}</p>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3 bg-indigo-50 text-indigo-800 border border-indigo-150 rounded-lg flex items-start space-x-2.5">
                    <Sparkles className="h-4 w-4 mt-0.5 text-indigo-650" />
                    <div>
                      <p className="font-semibold text-xs">Verify Your Application Resume</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        You can adjust your resume profile text before submitting or go with your profile default.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">
                      Resume Text Document
                    </label>
                    <textarea
                      rows={8}
                      className="w-full bg-slate-50 text-slate-800 font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
                      placeholder="Paste your standard text resume or background details here..."
                      value={customResume}
                      onChange={(e) => setCustomResume(e.target.value)}
                    />
                  </div>

                  {/* Custom screening questions inputs */}
                  {selectedJob.screeningQuestions && selectedJob.screeningQuestions.length > 0 && (
                    <div className="space-y-4 pt-3 border-t border-slate-200 mt-3 animate-fadeIn text-left">
                      <h5 className="font-bold text-slate-700 text-[10px] uppercase font-mono tracking-wider">Recruiter Screening Questions:</h5>
                      {selectedJob.screeningQuestions.map((q, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="block text-[11px] text-slate-600 font-semibold">{q}</label>
                          <textarea
                            rows={2}
                            required
                            placeholder="Type your answer here..."
                            value={screeningAnswers[idx] || ''}
                            onChange={(e) => {
                              const updated = [...screeningAnswers];
                              updated[idx] = e.target.value;
                              setScreeningAnswers(updated);
                            }}
                            className="w-full bg-slate-50 text-slate-850 placeholder-slate-400 font-sans text-xs p-2.5 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-2 border-t border-slate-200">
              <button
                onClick={() => {
                  if (showApplyModal) {
                    setShowApplyModal(false);
                  } else {
                    setSelectedJob(null);
                  }
                }}
                className="px-4 py-2 bg-slate-200/55 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition text-center cursor-pointer"
              >
                Cancel
              </button>

              {!showApplyModal ? (
                applications.some(a => a.jobId === selectedJob.id) ? (
                  <span className="px-4 py-2 bg-emerald-55 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg cursor-not-allowed select-none">
                    Already Applied
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setCustomResume(studentProfile ? studentProfile.resumeText : '');
                      setScreeningAnswers(selectedJob.screeningQuestions ? new Array(selectedJob.screeningQuestions.length).fill('') : []);
                      setShowApplyModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-705 text-white text-xs font-bold rounded-lg transition shadow-xs text-center cursor-pointer"
                  >
                    Apply with Profile
                  </button>
                )
              ) : (
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs text-center cursor-pointer"
                >
                  Submit Final Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
