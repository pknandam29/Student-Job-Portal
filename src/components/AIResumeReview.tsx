import React, { useState, useRef } from 'react';
import { Job } from '../types';
import { 
  Sparkles, Brain, CheckCircle2, RotateCw, AlertTriangle, Lightbulb, 
  Upload, FileText, X, Check, AlertCircle 
} from 'lucide-react';

interface AIResumeReviewProps {
  resumeText: string;
  studentSkills: string[];
  jobs: Job[];
}

interface ATSResult {
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  feedback: string;
}

export default function AIResumeReview({ resumeText, studentSkills, jobs }: AIResumeReviewProps) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');
  const [fileTextContent, setFileTextContent] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ATS scoring result
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);

  // Find selected job details
  const activeJob = jobs.find(j => j.id === selectedJobId);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      setError('File is too large. Maximum size is 4MB.');
      return;
    }

    const validTypes = ['text/plain', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      setError('Invalid file type. Only PDF and TXT files are accepted.');
      return;
    }

    setUploadedFile(file);
    setError('');

    const reader = new FileReader();

    // If it's a text file, we can also extract and show the preview text
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileTextContent(text);
        setFileBase64(btoa(unescape(encodeURIComponent(text))));
        setFileMimeType('text/plain');
      };
      reader.readAsText(file);
    } else {
      // PDF or other binary file: read as DataURL to get base64
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFileBase64(dataUrl);
        setFileMimeType(file.type || 'application/pdf');
        setFileTextContent(''); // PDF binary preview is not shown
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setFileBase64('');
    setFileMimeType('');
    setFileTextContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerATSScoring = async () => {
    // We need either raw profile text or an uploaded file
    const effectiveResumeText = fileTextContent || resumeText;
    if (!effectiveResumeText.trim() && !fileBase64) {
      setError('Please upload a resume file or populate your Student Profile resume details first.');
      return;
    }

    setLoading(true);
    setError('');
    setAtsResult(null);

    const targetTitle = activeJob ? activeJob.title : customTitle;
    const targetDesc = activeJob ? activeJob.description : customDesc;

    try {
      const response = await fetch('/api/ai/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: fileBase64 ? '' : effectiveResumeText,
          fileBase64: fileBase64 || '',
          fileMimeType: fileMimeType || '',
          targetJobTitle: targetTitle,
          targetJobDesc: targetDesc,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAtsResult(data);
      } else {
        setError(data.error || 'The Gemini ATS scorer responded with an error.');
      }
    } catch (err) {
      setError('Connection failure with Gemini AI. Please check settings and retry.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to highlight markdown structures beautifully
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
          <h3 key={idx} className="text-sm font-extrabold text-indigo-600 mt-5 mb-2.5 border-b border-slate-205 pb-1 font-sans">
            {trimmed.replace(/#+/g, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-600 mb-1.5 leading-relaxed font-medium">
            {trimmed.substring(1).trim()}
          </li>
        );
      }
      if (trimmed.match(/^\d+\./)) {
        return (
          <dt key={idx} className="ml-4 list-decimal text-xs text-slate-600 mb-1.5 leading-relaxed font-medium">
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

  // Calculate circular gauge parameters
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = atsResult 
    ? circumference - (Math.min(Math.max(atsResult.atsScore, 0), 100) / 100) * circumference 
    : circumference;

  const getScoreColorClass = (score: number) => {
    if (score >= 75) return 'text-emerald-600 stroke-emerald-500';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-650 stroke-rose-500';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 75) return 'bg-emerald-50 border-emerald-100 text-emerald-800';
    if (score >= 50) return 'bg-amber-50 border-amber-100 text-amber-800';
    return 'bg-rose-50 border-rose-100 text-rose-800';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6" id="ats-auditor-root">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-md font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>ATS Resume Scorer & Matcher</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 font-mono font-bold">
                Gemini 3.5 Flash
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Upload your PDF or text resume and analyze your fit against target jobs instantly</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side (Columns 1 & 2): Controls & Uploads */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Job Selection */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Target Placement / Position
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
              <option value="">-- Select Active Job Position --</option>
              {jobs.filter(j => j.status === 'Approved').map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} at {job.company}
                </option>
              ))}
              <option value="custom">-- Custom Position Profile --</option>
            </select>
          </div>

          {/* Custom Job Details Input */}
          {selectedJobId === 'custom' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fadeIn text-left">
              <h5 className="text-xs font-bold text-slate-800">Custom Target Specifications</h5>
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Target Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Junior React Engineer"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md py-1.5 px-2.5 text-xs font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Job Description or Primary Skills</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Required: React, TypeScript, HTML/CSS. Build modular UI widgets, collaborate with design teams..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md py-1.5 px-2.5 text-xs font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {activeJob && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-left animate-fadeIn">
              <p className="text-xs font-bold text-indigo-700">Target Requirements Selected:</p>
              <p className="text-[11px] text-slate-650 italic leading-relaxed line-clamp-2">
                "{activeJob.description}"
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {(activeJob.requiredSkills || []).map((skill, index) => (
                  <span key={index} className="text-[9px] bg-white text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-semibold font-mono">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resume Upload Drag & Drop Box */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Resume Document Upload (PDF / TXT)
            </label>
            
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                  isDragActive 
                    ? 'border-indigo-500 bg-indigo-50/30' 
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50/80'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                  className="hidden"
                />
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Drag & drop your resume file</span>
                <span className="text-[10px] text-slate-405 text-slate-400">Supports PDF and Plain Text (.txt) up to 4MB</span>
                <span className="text-[9px] text-indigo-650 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 font-bold font-mono">
                  Browse Files
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-650">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate" title={uploadedFile.name}>
                      {uploadedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(uploadedFile.size / 1024).toFixed(1)} KB &bull; {uploadedFile.name.endsWith('.pdf') ? 'PDF Document' : 'Text File'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200/50 rounded transition cursor-pointer"
                  title="Remove File"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Fallback Checkbox indicator if no file uploaded */}
            {!uploadedFile && (
              <div className="mt-2.5 p-3 bg-indigo-50/40 border border-indigo-100/60 rounded-lg flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-indigo-650 flex-shrink-0" />
                <div className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  No file uploaded? We will scan your **Student Profile details** and plain-text resume automatically.
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={triggerATSScoring}
            disabled={loading || (!resumeText.trim() && !fileBase64)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-705 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Running ATS Compatibility Scan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Run Smart ATS Scan</span>
              </>
            )}
          </button>

          {/* Display Errors */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start space-x-2 font-mono font-bold animate-fadeIn">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Right Side (Columns 3, 4 & 5): Scan Results */}
        <div className="lg:col-span-3 bg-slate-50/50 rounded-2xl border border-slate-200 min-h-[400px] p-5 flex flex-col justify-between shadow-xs">
          
          <div className="space-y-5 h-full">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-500 flex items-center space-x-1.5 border-b border-slate-200 pb-2.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>ATS Scan Analytics Report</span>
            </h4>

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                <p className="text-xs font-mono text-slate-500 animate-pulse text-center max-w-[280px]">
                  Extracting file contents, analyzing skill vectors, and calculating keywords matching density...
                </p>
              </div>
            )}

            {!loading && !atsResult && !error && (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <Brain className="h-10 w-10 text-slate-350 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-700">No active scan currently conducted.</p>
                <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto leading-relaxed font-semibold">
                  Choose a target position on the left, upload a PDF/text resume, and click 'Run Smart ATS Scan'.
                </p>
              </div>
            )}

            {/* Results Board */}
            {!loading && atsResult && (
              <div className="space-y-5 animate-fadeIn text-left">
                
                {/* Score Widget Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                  
                  {/* Circular SVG Gauge */}
                  <div className="flex justify-center sm:col-span-1">
                    <div className="relative h-24 w-24 flex items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          className="stroke-slate-100 fill-transparent"
                          strokeWidth="8"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          className={`fill-transparent transition-all duration-1000 ${getScoreColorClass(atsResult.atsScore)}`}
                          strokeWidth="8"
                          strokeDasharray={circumference}
                          strokeDashoffset={scoreOffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-lg font-extrabold text-slate-900 block leading-none">
                          {atsResult.atsScore}%
                        </span>
                        <span className="text-[9px] uppercase font-mono text-slate-400 font-bold leading-none tracking-wider">
                          ATS Fit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suitability Category & Skills Match Count */}
                  <div className="sm:col-span-2 text-center sm:text-left space-y-1.5">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-455 text-slate-400">Match Classification</span>
                      <div className="flex items-center justify-center sm:justify-start space-x-1.5 mt-0.5">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${getScoreBgClass(atsResult.atsScore)}`}>
                          {atsResult.atsScore >= 75 ? 'Highly Compatible' : atsResult.atsScore >= 50 ? 'Moderate Compatibility' : 'Low Compatibility'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                      Your resume matches <strong className="text-slate-800">{atsResult.matchedSkills.length}</strong> required competencies, with <strong className="text-slate-800">{atsResult.missingSkills.length}</strong> missing gaps identified.
                    </div>
                  </div>

                </div>

                {/* Skills Checklists Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Matched Skills */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                    <h5 className="text-[10px] font-mono uppercase font-bold text-slate-450 flex items-center space-x-1 text-slate-500">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span>Matched Keywords ({atsResult.matchedSkills.length})</span>
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {atsResult.matchedSkills.length === 0 ? (
                        <span className="text-[10px] italic text-slate-400">No overlapping skills found.</span>
                      ) : (
                        atsResult.matchedSkills.map((sk, i) => (
                          <span key={i} className="text-[9.5px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
                            {sk}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                    <h5 className="text-[10px] font-mono uppercase font-bold text-slate-450 flex items-center space-x-1 text-slate-500">
                      <X className="h-3.5 w-3.5 text-rose-500" />
                      <span>Missing Target Skills ({atsResult.missingSkills.length})</span>
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {atsResult.missingSkills.length === 0 ? (
                        <span className="text-[10px] italic text-slate-450 text-slate-400">Fully covered! No gaps found.</span>
                      ) : (
                        atsResult.missingSkills.map((sk, i) => (
                          <span key={i} className="text-[9.5px] font-mono bg-rose-50 text-rose-800 border border-rose-100 px-1.5 py-0.5 rounded font-bold">
                            {sk}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Feedback suggestions */}
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  <h5 className="text-[10.5px] font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span>Improvement Critiques & Advice</span>
                  </h5>
                  <div className="space-y-1.5">
                    {renderMarkdownText(atsResult.feedback)}
                  </div>
                </div>

              </div>
            )}
          </div>

          {atsResult && (
            <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-2.5 text-right font-mono font-bold">
              Powered by Google GenAI API &bull; Model gemini-3.5-flash
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
