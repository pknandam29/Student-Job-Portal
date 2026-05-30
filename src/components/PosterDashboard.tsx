import React, { useState, useEffect } from 'react';
import { Job, Application, ChatMessage } from '../types';
import { 
  Plus, Edit3, Trash2, Users, Building, MapPin, DollarSign, Calendar, 
  Send, RefreshCw, AlertCircle, FileText, Check, MessageSquare, Clock, 
  AlertTriangle, X, CheckCircle, HelpCircle
} from 'lucide-react';

interface PosterDashboardProps {
  posterId: string;
}

export default function PosterDashboard({ posterId }: PosterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  // Job Posting Form Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobType, setJobType] = useState<'Full Time' | 'Part Time' | 'Internship' | 'Remote'>('Internship');
  const [deadline, setDeadline] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [requiredSkillsString, setRequiredSkillsString] = useState('');

  // Active Chats for Applicants
  const [activeChatApp, setActiveChatApp] = useState<Application | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Screening Questions State & Helpers
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);

  const addScreeningQuestion = () => {
    if (screeningQuestions.length >= 3) return;
    setScreeningQuestions([...screeningQuestions, '']);
  };

  const handleQuestionChange = (index: number, val: string) => {
    const updated = [...screeningQuestions];
    updated[index] = val;
    setScreeningQuestions(updated);
  };

  const removeScreeningQuestion = (index: number) => {
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [posterId]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs?role=Student&userId=${posterId}&myPostings=true`);
      const data = await response.json();
      if (response.ok) {
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching poster jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/applications?role=Student&userId=${posterId}&asPoster=true`);
      const data = await response.json();
      if (response.ok) {
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications', err);
    }
  };

  const openCreateModal = () => {
    setEditingJob(null);
    setTitle('');
    setCompany(company || 'InnovateCorp'); // Fallback or autofill
    setDescription('');
    setLocation('');
    setSalary('');
    setJobType('Internship');
    setDeadline('');
    setContactInfo(contactInfo || 'manager@company.com');
    setRequiredSkillsString('');
    setScreeningQuestions([]);
    setShowFormModal(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setTitle(job.title);
    setCompany(job.company);
    setDescription(job.description);
    setLocation(job.location);
    setSalary(job.salary);
    setJobType(job.jobType);
    setDeadline(job.deadline);
    setContactInfo(job.contactInfo);
    setRequiredSkillsString((job.requiredSkills || []).join(', '));
    setScreeningQuestions(job.screeningQuestions || []);
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = requiredSkillsString
      .split(',')
      .map(s => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title,
      company,
      description,
      location,
      salary,
      jobType,
      requiredSkills: skillsArray,
      deadline,
      contactInfo,
      createdBy: posterId,
      createdByName: company,
      screeningQuestions: screeningQuestions.filter(q => q.trim().length > 0),
    };

    try {
      let response;
      if (editingJob) {
        // Edit
        response = await fetch(`/api/jobs/${editingJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setMessage({
          text: editingJob 
            ? 'Opportunity saved. Note: Edits prompt re-approval from administrators.' 
            : 'New draft submitted for admin evaluation',
          type: editingJob ? 'warn' : 'success',
        });
        setShowFormModal(false);
        fetchJobs();
        setTimeout(() => setMessage(null), 5000);
      } else {
        alert('Server returned error on submit.');
      }
    } catch (err) {
      console.error('Submit error', err);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Delete this posting? This will remove all student applications sent to it as well.')) return;
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMessage({ text: 'Listing purged from Student Job Portal', type: 'warn' });
        fetchJobs();
        fetchApplications();
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
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

  // Poll for messages in active applicant chat
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
        console.error('Error polling', err);
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
          senderId: posterId,
          senderRole: 'Student',
          senderName: `${activeChatApp.job?.company || 'Recruiter'} Hiring Team`,
          message: newMsgText,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages(prev => [...prev, data]);
        setNewMsgText('');
      }
    } catch (err) {
      console.error('Error sending chat', err);
    }
  };

  return (
    <div className="space-y-6" id="poster-dashboard-root">
      
      {/* Messaging alerts */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold border flex items-center space-x-2 animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
        }`}>
          <AlertCircle className="h-5 w-5" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 font-sans font-bold text-sm border-b-2 transition duration-200 cursor-pointer ${
            activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          My Posted Positions
        </button>
        <button
          onClick={() => setActiveTab('applicants')}
          className={`pb-3 font-sans font-bold text-sm border-b-2 transition duration-200 cursor-pointer relative ${
            activeTab === 'applicants' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Manage Applicants
          {applications.length > 0 && (
            <span className="absolute -top-1.5 -right-3.5 bg-indigo-600 text-[10px] text-white px-2 py-0.5 rounded-full font-mono font-bold">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* CONTENT MODES */}

      {/* Mode 1: Posted Jobs List */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide font-sans">Recruiting Outlets</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Submitted configurations undergo admin checks before general listing is visible to search engines.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center space-x-1.5 shadow-sm transition duration-150 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Compose Job Posting</span>
            </button>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 font-mono text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-600" /> Loading owned positions...
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
              <Building className="h-12 w-12 text-slate-350 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No vacancies composed yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed font-semibold">Tap 'Compose Job Posting' to draft your first position on the Student Job Portal.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-fadeIn">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Position details</th>
                    <th className="p-4">Placement Details</th>
                    <th className="p-4">Stipend</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                        <div className="text-slate-400 text-[10px] font-mono mt-0.5">Deadline: {job.deadline}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1 text-slate-700">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{job.location}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono font-bold">{job.jobType}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600">
                        {job.salary}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-mono font-bold tracking-wider inline-flex items-center space-x-1 border ${
                          job.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                          job.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-850 border-amber-250'
                        }`}>
                          {job.status === 'Approved' && <CheckCircle className="h-3 w-3 mr-0.5" />}
                          {job.status === 'Rejected' && <AlertTriangle className="h-3 w-3 mr-0.5" />}
                          {job.status === 'Pending' && <Clock className="h-3 w-3 mr-0.5" />}
                          <span>{job.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[11px] rounded border border-slate-200 hover:text-indigo-650 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded border border-rose-200 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Applicants Management Console */}
      {activeTab === 'applicants' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-500 uppercase">
              Incoming App Profiles Tracking
            </h3>
            {applications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
                <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No applicants have registered interest yet</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed font-semibold">Once students search and hit "Apply", candidate dossiers materialize here instantly.</p>
              </div>
            ) : (
              applications.map(app => (
                <div 
                  key={app.id} 
                  className={`bg-white border p-5 rounded-2xl flex flex-col justify-between gap-4 transition duration-200 shadow-sm ${
                    activeChatApp?.id === app.id ? 'border-indigo-600 bg-slate-50/50 ring-2 ring-indigo-500/10' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Position applied & applicant name */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                          <span>{app.studentName}</span>
                          <span className="text-[10px] font-normal text-slate-450 text-slate-500">&bull;&nbsp;{app.studentEmail}</span>
                        </h4>
                        <p className="text-xs text-slate-505 text-slate-500 font-medium">Applied for: <span className="text-indigo-650 font-bold">{app.job?.title}</span></p>
                      </div>

                      {/* Select state buttons */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-500 font-mono font-bold mr-1">Status:</span>
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                          className="bg-slate-50 text-slate-800 text-[10px] font-mono font-bold border border-slate-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Reviewing">Reviewing</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Resume info clip */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-650 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed font-semibold">
                      {app.resumeText || app.studentProfile?.resumeText || 'No custom resume included.'}
                    </div>

                    {/* Screening Answers details */}
                    {app.answers && app.answers.length > 0 && (
                      <div className="bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-2 mt-2">
                        <p className="text-[10px] font-mono uppercase font-bold text-indigo-755 text-indigo-700">Screening Answers:</p>
                        {app.answers.map((ans, idx) => (
                          <div key={idx} className="space-y-0.5 text-left">
                            <p className="font-bold text-slate-900 text-[11px]">&bull; {ans.question}</p>
                            <p className="text-[11px] text-slate-600 pl-3 leading-normal font-medium">{ans.answer || <span className="italic text-slate-400">No response.</span>}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Target skills matching */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[9px] text-slate-405 text-slate-400 uppercase font-mono font-bold mr-1">Skills:</span>
                      {app.studentProfile?.skills?.map((sk, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border border-slate-200/60 font-semibold">
                          {sk}
                        </span>
                      )) || <span className="text-[9px] text-slate-400">None stated.</span>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-150">
                    <button
                      onClick={() => openChatForApplication(app)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 hover:text-indigo-650 rounded-lg border border-slate-200 transition duration-150 cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Open Candidate Chat</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Interactive Chat interface */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between h-[450px] overflow-hidden">
            {activeChatApp ? (
              <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 max-w-[170px] truncate">
                      Chat: {activeChatApp.studentName}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]">
                      {activeChatApp.studentProfile?.degree || activeChatApp.studentEmail}
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveChatApp(null)} 
                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                  {chatLoading ? (
                    <div className="m-auto text-xs text-slate-500 flex items-center space-x-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      <span>Syncing transcripts...</span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="m-auto text-center p-4">
                      <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                      <p className="text-[11px] text-slate-500 font-bold">No messages yet.</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Send coordinates or interview details to candidate now!</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMe = msg.senderId === posterId;
                      return (
                        <div key={msg.id} className={`max-w-[85%] flex flex-col space-y-0.5 ${
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        }`}>
                          <span className="text-[8px] font-mono font-bold text-slate-405 text-slate-400">{msg.senderName}</span>
                          <div className={`p-2.5 rounded-xl text-xs leading-relaxed shadow-xs ${
                            isMe ? 'bg-indigo-600 text-white font-medium rounded-tr-none' : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none font-medium'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[8px] font-mono text-slate-400 font-semibold">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form sending block */}
                <form onSubmit={sendChatMessage} className="p-3 bg-slate-50 border-t border-slate-200 flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="Text candidate..."
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button 
                    type="submit" 
                    className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-705 rounded-lg transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="m-auto text-center p-6 space-y-2 text-slate-400 animate-fadeIn">
                <Users className="h-10 w-10 text-slate-350 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Student Messaging center</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed font-semibold">
                  Click on <strong>"Open Candidate Chat"</strong> next to any application dossier on the left to start live chats and arrange online meetings!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* JOBS ADDS/EDITS POPUP FORM MODAL overlay */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn border-0" id="pos-compose-modal">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 font-sans">
                <Building className="h-4.5 w-4.5 text-indigo-600" />
                <span>{editingJob ? 'Edit Position details' : 'Draft Job Placement'}</span>
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-600">
              {editingJob && (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-205 rounded-lg flex items-start space-x-2 select-none">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  <p className="text-[10px] font-semibold leading-relaxed">
                    <strong>Note:</strong> Modifying details of an active position reverts its status to <strong>Pending</strong>. It is temporarily hidden from students until authorized again.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Web Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg py-2 px-3 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Company / Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe or Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-550 bg-slate-50 border border-slate-205 border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Full Description (Minimum 30 words recommended)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide responsibilities, tools utilized, workspace culture, benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg py-2 px-3 text-slate-800 font-sans leading-relaxed font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Job Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hybrid, CA / NY"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg py-1.5 px-3 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Stipend / Salary Range</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $45/hr or $90,000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg py-1.5 px-3 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg py-1.5 px-3 text-slate-800 font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Employment Category</label>
                  <select
                    value={jobType}
                    onChange={(e: any) => setJobType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg py-1.5 px-3 text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Full Time">Full-Time (Grad/Regular)</option>
                    <option value="Part Time">Part-Time</option>
                    <option value="Internship">Internship / Co-op</option>
                    <option value="Remote">Remote (Global/US)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Primary Email Contact</label>
                  <input
                    type="email"
                    required
                    placeholder="careers@brand.com"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-lg py-1.5 px-3 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Required Skill keywords (Comma separated list)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, GraphQL, NodeJS"
                  value={requiredSkillsString}
                  onChange={(e) => setRequiredSkillsString(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic font-medium">Typing exact tags lets students filter your listing perfectly.</p>
              </div>

              {/* Screening Questions Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-left">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
                    Screening Questions (Max 3)
                  </label>
                  {screeningQuestions.length < 3 && (
                    <button
                      type="button"
                      onClick={addScreeningQuestion}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      + Add Question
                    </button>
                  )}
                </div>
                {screeningQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-center space-x-2 animate-fadeIn">
                    <input
                      type="text"
                      required
                      placeholder={`e.g. Why do you want to join our team?`}
                      value={q}
                      onChange={(e) => handleQuestionChange(idx, e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreeningQuestion(idx)}
                      className="text-rose-600 hover:text-rose-750 text-xs font-bold px-1.5 py-1 hover:bg-rose-50 rounded transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 mt-1 italic font-medium">Add short-answer screening questions to filter candidates more effectively.</p>
              </div>

              {/* Form Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-lg shadow-sm transition cursor-pointer"
                >
                  {editingJob ? 'Save Edits' : 'Submit Draft for Audit'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
