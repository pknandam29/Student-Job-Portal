import React, { useState, useEffect } from 'react';
import { User, StudentProfile } from './types';
import Navbar from './components/Navbar';
import AuthScreens from './components/AuthScreens';
import StudentDashboard from './components/StudentDashboard';
import PosterDashboard from './components/PosterDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentProfileModal from './components/StudentProfileModal';
import { Shield, Sparkles, AlertCircle, FileText } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [alert, setAlert] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Auto-login Alex (Student) by default so the application is immediately interactive and gorgeous!
  useEffect(() => {
    // Check local storage or default to standard student login if none exists
    const stored = localStorage.getItem('sjp_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      } catch (err) {
        // Fallback below
      }
    } else {
      // Direct instant auto-login to showcase full components on first load
      const defaultStudent: User = {
        id: 'usr_student',
        username: 'Alex Rivera',
        email: 'student@college.edu',
        role: 'Student',
        date_joined: '2026-04-01T09:15:00Z',
      };
      setCurrentUser(defaultStudent);
      localStorage.setItem('sjp_session', JSON.stringify(defaultStudent));
    }
  }, []);

  // Fetch student profile if logged in as student
  useEffect(() => {
    if (currentUser?.role === 'Student') {
      fetchStudentProfile();
    } else {
      setStudentProfile(null);
    }
  }, [currentUser]);

  const fetchStudentProfile = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/student/profile/${currentUser.id}`);
      const data = await response.json();
      if (response.ok) {
        setStudentProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile state', err);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sjp_session', JSON.stringify(user));
    triggerAlert(`Logged in as ${user.username} (${user.role})`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStudentProfile(null);
    localStorage.removeItem('sjp_session');
    triggerAlert('Logged out successfully from Job Portal.', 'info');
  };

  // Immediate Identity Swapping Sandbox
  const handleActorSwap = async (targetRole: 'Student' | 'Poster' | 'Admin') => {
    let email = 'student@college.edu';
    let password = 'student123';

    if (targetRole === 'Poster') {
      email = 'poster@company.com';
      password = 'poster123';
    } else if (targetRole === 'Admin') {
      email = 'admin@portal.com';
      password = 'admin123';
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('sjp_session', JSON.stringify(data.user));
        triggerAlert(`Swapped profile view to ${data.user.role}!`, 'success');
      }
    } catch (err) {
      console.error('Swap failed', err);
    }
  };

  const triggerAlert = (text: string, type: 'success' | 'info') => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" id="main-app-container">
      
      {/* Session Top Navigation */}
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onActorSwap={handleActorSwap} 
        onOpenProfile={() => setShowProfileModal(true)} 
      />

      {/* Main Body */}
      {currentUser ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Action toast notifies status switches */}
          {alert && (
            <div className={`p-3 rounded-lg text-xs font-mono border flex items-center space-x-2 animate-fadeIn ${
              alert.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}>
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>{alert.text}</span>
            </div>
          )}

          {/* Role-Based Panel Routing */}
          <div className="animate-fadeIn">
            {currentUser.role === 'Student' && (
              <StudentDashboard 
                studentId={currentUser.id} 
                studentProfile={studentProfile} 
                onRefreshProfile={fetchStudentProfile} 
              />
            )}
            {currentUser.role === 'Poster' && (
              <PosterDashboard 
                posterId={currentUser.id} 
              />
            )}
            {currentUser.role === 'Admin' && (
              <AdminDashboard />
            )}
          </div>

          {/* Student Profile Settings Pop-up Modal */}
          <StudentProfileModal
            studentId={currentUser.id}
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onSave={fetchStudentProfile}
          />

        </main>
      ) : (
        <AuthScreens onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-500 font-mono text-[10px]">
        <p>Student Job Placement & Verification Network &bull; Dev Mode Active</p>
      </footer>
    </div>
  );
}
