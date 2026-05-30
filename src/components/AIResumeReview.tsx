import React, { useState } from 'react';
import { Job } from '../types';
import { Sparkles, Brain, CheckCircle2, RotateCw, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';

interface AIResumeReviewProps {
  resumeText: string;
  studentSkills: string[];
  jobs: Job[];
}

export default function AIResumeReview({ resumeText, studentSkills, jobs }: AIResumeReviewProps) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [reviewResult, setReviewResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find selected job to pass details
  const activeJob = jobs.find(j => j.id === selectedJobId);

  const triggerAudit = async () => {
    if (!resumeText.trim()) {
      setError('Please populate some resume content in your Student Profile first.');
      return;
    }

    setLoading(true);
    setError('');
    setReviewResult('');

    const targetTitle = activeJob ? activeJob.title : customTitle;
    const targetDesc = activeJob ? activeJob.description : customDesc;

    try {
      const response = await fetch('/api/ai/resume-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          targetJobTitle: targetTitle,
          targetJobDesc: targetDesc,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setReviewResult(data.review);
      } else {
        setError(data.error || 'The Gemini review system responded with an error.');
      }
    } catch (err) {
      setError('Connection timeout with AI. Please retry shortly.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to highlight simple markdown lines beautifully
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-slate-800 mt-4 mb-2 first:mt-0 font-sans tracking-tight">
            {trimmed.replace('###', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##') || trimmed.startsWith('#')) {
        return (
          <h3 key={idx} className="text-sm font-extrabold text-indigo-600 mt-5 mb-2.5 border-b border-slate-200 pb-1 font-sans">
            {trimmed.replace(/#+/g, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-slate-600 mb-1.5 leading-relaxed">
            {trimmed.substring(1).trim()}
          </li>
        );
      }
      if (trimmed.match(/^\d+\./)) {
        return (
          <dt key={idx} className="ml-5 list-decimal text-xs text-slate-600 mb-1.5 leading-relaxed">
            {trimmed}
          </dt>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2 font-medium">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6" id="ai-auditor-root">
      
      {/* Module Title */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-md font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Gemini AI Resume Reviewer</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 font-mono font-bold">
                Server-Side GenAI
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Match resume keywords against active student postings seamlessly</p>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Parameters Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Comparative Target Job
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setCustomTitle('');
                setCustomDesc('');
              }}
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition font-medium cursor-pointer"
            >
              <option value="">-- [Optional] Select Approved Active Job --</option>
              {jobs.filter(j => j.status === 'Approved').map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} at {job.company} ({job.location})
                </option>
              ))}
              <option value="custom">-- Custom Role Template --</option>
            </select>
          </div>

          {selectedJobId === 'custom' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h5 className="text-xs font-bold text-slate-800">Custom Target Details</h5>
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Target Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Engineer"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md py-1.5 px-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Job Description or Main Skills</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Build API controllers, optimize SQL servers, deploy React UI clients..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md py-1.5 px-2 text-xs"
                />
              </div>
            </div>
          )}

          {activeJob && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-indigo-750 text-indigo-650">Target Requirements Selected:</p>
              <div className="text-[11px] text-slate-600 line-clamp-2 italic">
                "{activeJob.description}"
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {activeJob.requiredSkills.map((skill, index) => (
                  <span key={index} className="text-[10px] bg-white text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-semibold font-mono">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-indigo-50/20 p-4 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-900 mb-2 flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Current Resume Content Quick Look:</span>
            </h4>
            {resumeText.trim() ? (
              <div className="text-[10px] font-mono text-slate-600 max-h-32 overflow-y-auto bg-white border border-slate-200 p-3 rounded-lg whitespace-pre-wrap leading-relaxed font-semibold">
                {resumeText}
              </div>
            ) : (
              <div className="text-xs text-rose-800 bg-rose-50 px-2 py-1.5 rounded flex items-center space-x-2 border border-rose-200">
                <AlertTriangle className="h-4 w-4" />
                <span>No resume text entered! Head to "My Student Profile" first to supply your details.</span>
              </div>
            )}
          </div>

          <button
            onClick={triggerAudit}
            disabled={loading || !resumeText.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-705 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Gemini analyzing candidate profile...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Begin Smart AI Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Generated Recommendations Box */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200 min-h-[300px] p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-500 flex items-center space-x-1.5 border-b border-slate-200 pb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>Audit Findings & Recommendations</span>
            </h4>

            {loading && (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                <p className="text-xs font-mono text-slate-500 animate-pulse text-center max-w-[250px]">
                  Analyzing project descriptions, skills matching, and structural grammar...
                </p>
              </div>
            )}

            {error && (
              <div className="text-xs text-rose-805 text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-lg font-mono font-bold">
                {error}
              </div>
            )}

            {!loading && !reviewResult && !error && (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <Brain className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-700">No active audit currently running.</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed font-semibold">
                  Choose a target position on the left and tap 'Begin Smart AI Audit' to fetch instant critique.
                </p>
              </div>
            )}

            {!loading && reviewResult && (
              <div className="max-h-[380px] overflow-y-auto pr-1 animate-fadeIn">
                {renderMarkdownText(reviewResult)}
              </div>
            )}
          </div>

          {reviewResult && (
            <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-2 text-right font-mono font-bold">
              Powered by GenAI API & bull; Model gemini-2.5-flash
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
