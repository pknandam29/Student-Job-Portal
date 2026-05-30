import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import { X, User, School, Sparkles, CheckSquare, Save, Hash } from 'lucide-react';

interface StudentProfileModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function StudentProfileModal({ studentId, isOpen, onClose, onSave }: StudentProfileModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [skillsString, setSkillsString] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentProfile();
    }
  }, [isOpen]);

  const fetchCurrentProfile = async () => {
    try {
      const response = await fetch(`/api/student/profile/${studentId}`);
      const data: StudentProfile = await response.json();
      if (response.ok) {
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setCollegeName(data.collegeName || '');
        setDegree(data.degree || '');
        setSkillsString((data.skills || []).join(', '));
        setResumeText(data.resumeText || '');
      }
    } catch (err) {
      console.error('Error fetching student profile data', err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const skillsArray = skillsString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      name,
      email,
      phone,
      collegeName,
      degree,
      skills: skillsArray,
      resumeText,
    };

    try {
      const response = await fetch(`/api/student/profile/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn" id="student-profile-setup">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200 rounded-t-2xl">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
            <User className="h-4.5 w-4.5 text-indigo-600" />
            <span>My Student Profile Details</span>
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleProfileSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
                placeholder="Alex Rivera"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">Phone Handle / Contact</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
                placeholder="555-0199"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">College/Institution Name</label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
                placeholder="State Tech University"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">Degree Course / Level</label>
              <input
                type="text"
                required
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
                 placeholder="B.S. in Computer Science"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">
              Active Technology Skills (Comma separated)
            </label>
            <input
              type="text"
              required
              value={skillsString}
              onChange={(e) => setSkillsString(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
              placeholder="React, TypeScript, CSS, Node.js"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">Helps automatic AI keyword scanner check your fitness.</p>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">
              Primary Interactive Resume (Plain Text Format)
            </label>
            <textarea
              rows={6}
              required
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
              placeholder="Paste details of education, achievements, and structural work experience..."
            />
          </div>

          {/* Form Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1 cursor-pointer text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Details'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
