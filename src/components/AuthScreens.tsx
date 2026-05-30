import React, { useState } from 'react';
import { UserRole } from '../types';
import { Briefcase, Key, Mail, Shield, Sparkles, User as UserIcon } from 'lucide-react';

interface AuthScreensProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreens({ onLoginSuccess }: AuthScreensProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Could not connect to the job portal server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      setError('Please populate all registration fields.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Registration successful! Auto-logging in now...');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection failure during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-load default users for fast testing demo
  const quickLogIn = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-6 flex-col" id="auth-main">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-100/80 border border-slate-200 p-8 space-y-6 animate-fadeIn">
        
        {/* Brand visual header inside card */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-605 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md mb-3">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            {isRegistering ? 'Create Student/Recruiter Account' : 'UniJobs Portal'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegistering ? 'Register to get verified or apply' : 'Find your next gig, or hire state tech stars'}
          </p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-lg font-mono">
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg font-mono">
            {success}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                Display Name / Company Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera or InnovateCorp"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                Your Primary Role
              </label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setRole('Student')}
                  className={`py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                    role === 'Student'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Poster')}
                  className={`py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                    role === 'Poster'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Job Poster</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition duration-150 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{isRegistering ? 'Complete Registration' : 'Log In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="flex justify-between items-center text-[11px] pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setSuccess('');
            }}
            className="text-indigo-600 hover:text-indigo-700 hover:underline transition font-mono font-bold"
          >
            {isRegistering ? 'Already registered? Log in' : 'New applicant? Create account'}
          </button>
          
          {!isRegistering && (
            <button
              onClick={() => alert('Password reset link has been dispatched to ' + (email || 'your registered email') + '!')}
              className="text-slate-500 hover:text-slate-700 transition"
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>

      {/* QUICK TESTING PRESETS RAIL */}
      <div className="w-full max-w-md mt-6 bg-white rounded-xl p-5 border border-slate-200 text-center shadow-sm">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-center space-x-1.5">
          <Shield className="h-3.5 w-3.5 text-indigo-600" />
          <span>Interactive Prototype Sandbox Accs</span>
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => quickLogIn('student@college.edu', 'student123')}
            className="py-1.5 px-2 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-mono font-bold cursor-pointer"
          >
            Student Account
          </button>
          <button
            onClick={() => quickLogIn('poster@company.com', 'poster123')}
            className="py-1.5 px-2 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-mono font-bold cursor-pointer"
          >
            Job Poster Acc
          </button>
          <button
            onClick={() => quickLogIn('admin@portal.com', 'admin123')}
            className="py-1.5 px-2 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition font-mono font-bold cursor-pointer"
          >
            System Admin
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-3 italic">
          Tip: Hit login after choosing a button, or switch roles mid-flight in the header bar at any time!
        </p>
      </div>
    </div>
  );
}
