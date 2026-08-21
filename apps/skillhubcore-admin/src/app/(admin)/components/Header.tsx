'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Search, Bell, Mail, HelpCircle, LogOut, PanelRight } from 'lucide-react';

interface HeaderProps {
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: (open: boolean) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (open: boolean) => void;
  headerTitle: string;
  headerSubtitle: string;
  pathname: string;
  rightSidebarContent: React.ReactNode;
  isLoggingOut: boolean;
  handleLogout: () => void;
}

export function Header({
  isLeftSidebarOpen,
  setIsLeftSidebarOpen,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  headerTitle,
  headerSubtitle,
  pathname,
  rightSidebarContent,
  isLoggingOut,
  handleLogout
}: HeaderProps) {
  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm transition-all">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-pink-500 outline-none"
          aria-label="Toggle Left Sidebar"
        >
          <Menu size={20} />
        </button>

        {headerTitle && (
          <div className="flex flex-col ml-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-outfit tracking-tight leading-none">
                {headerTitle}
              </h2>
              {false && (
                <span className="bg-pink-50 text-pink-600 text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-pink-100">
                  ARCHITECTURE
                </span>
              )}
            </div>
            {headerSubtitle && (
              <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                {headerSubtitle}
              </p>
            )}
          </div>
        )}

        <div className="relative hidden md:block w-96 ml-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
            aria-label="Search platform"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
          aria-label="View notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white border border-white">12</span>
        </button>
        <button
          className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
          aria-label="View messages"
        >
          <Mail size={20} />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white border border-white">8</span>
        </button>
        <button
          className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
          aria-label="Get help"
        >
          <HelpCircle size={20} />
        </button>

        <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
        <div className="flex items-center gap-3 text-left pl-1">
          <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shrink-0 relative">
            <Image src="https://i.pravatar.cc/150?u=superadmin" alt="Super Admin" width={36} height={36} className="h-full w-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-none">Super Admin</p>
            <p className="text-xs text-slate-500 mt-1">Administrator</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-pink-500 outline-none"
          aria-label="Logout"
          title="Logout from SkillHubCore Admin"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>

        {rightSidebarContent && (
          <>
            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

            {/* Right Sidebar Toggle */}
            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`transition-colors p-2 rounded-lg border focus:ring-2 focus:ring-pink-500 outline-none ${isRightSidebarOpen ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'}`}
              aria-label="Toggle Dashboard Tools"
              title="Toggle Right Sidebar"
            >
              <PanelRight size={20} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
