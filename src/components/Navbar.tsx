import React from 'react';
import { User, UserRole } from '../types';
import { Briefcase, Shield, User as UserIcon, LogOut, RefreshCw, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onActorSwap: (role: UserRole) => void;
  onOpenProfile: () => void;
}

export default function Navbar({ currentUser, onLogout, onActorSwap, onOpenProfile }: NavbarProps) {
  const [showSwapDropdown, setShowSwapDropdown] = React.useState(false);

  return (
    <nav className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-40 shadow-sm" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <span className="font-sans font-bold tracking-tight text-lg text-slate-900 block font-sans">UniJobs</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wide uppercase">Placement Network</span>
            </div>
          </div>

          {/* Actions & Session Controls */}
          {currentUser && (
            <div className="flex items-center space-x-4">
              {/* Actor Quick Switcher */}
              <div className="relative">
                <button
                  id="actor-switch-btn"
                  onClick={() => setShowSwapDropdown(!showSwapDropdown)}
                  className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm border border-slate-200 font-medium transition duration-150 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin-hover" />
                  <span>Test Identities</span>
                </button>

                {showSwapDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 text-slate-800">
                    <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold">Switch Current Role</p>
                    </div>
                    <button
                      onClick={() => {
                        onActorSwap('Student');
                        setShowSwapDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/50 flex items-center space-x-2.5 transition text-sm text-slate-800 border-b border-slate-100/60"
                    >
                      <UserIcon className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Alex Rivera (Student)</p>
                        <p className="text-[10px] text-slate-500">Search/post jobs, review applicants & ATS</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onActorSwap('Admin');
                        setShowSwapDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/50 flex items-center space-x-2.5 transition text-sm text-slate-800"
                    >
                      <Shield className="h-4 w-4 text-rose-600" />
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Admin Team (Moderator)</p>
                        <p className="text-[10px] text-slate-500">Approve job list & handle users</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* User badge */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-sm font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="max-w-[120px] truncate font-semibold text-slate-700">
                  {currentUser.username}
                </span>
                <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                  {currentUser.role}
                </span>
              </div>

              {/* Student Profile Button */}
              {currentUser.role === 'Student' && (
                <button
                  id="profile-lnk"
                  onClick={onOpenProfile}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold tracking-tight transition cursor-pointer"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>My Profile</span>
                </button>
              )}

              {/* Log Out */}
              <button
                id="logout-btn"
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-slate-50 transition duration-150 tooltip cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
