'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  BarChart3, 
  Calendar, 
  FileText, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  User,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  className?: string;
}

export default function Sidebar({ isCollapsed, setIsCollapsed, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const trackerItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Track Progress', path: '/tracker', icon: Layers },
    { name: 'Summary', path: '/summary', icon: BarChart3 },
  ];

  const managementItems = [
    { name: 'Interviews', path: '/interviews', icon: Calendar },
    { name: 'CV Builder', icon: FileText },
    { name: 'AI Studio', icon: Sparkles },
  ];

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const renderNavLinks = (items: typeof trackerItems) => {
    return items.map((item) => {
      const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
      const Icon = item.icon;

      return (
        <Link
          key={item.name}
          href={item.path}
          onClick={() => setIsMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-200 group cursor-pointer ${
            isActive
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
          <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'md:hidden opacity-0 w-0' : 'opacity-100'}`}>
            {item.name}
          </span>
        </Link>
      );
    });
  };

  const renderDisabledLinks = (items: typeof managementItems) => {
    return items.map((item) => {
      const Icon = item.icon;

      if (item.path) {
        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
        return (
          <Link
            key={item.name}
            href={item.path}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-200 group cursor-pointer ${
              isActive
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'md:hidden opacity-0 w-0' : 'opacity-100'}`}>
              {item.name}
            </span>
          </Link>
        );
      }

      return (
        <div
          key={item.name}
          className="relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs text-slate-600 border border-transparent cursor-not-allowed group"
        >
          <Icon className="w-4.5 h-4.5 shrink-0 text-slate-700" />
          <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'md:hidden opacity-0 w-0' : 'opacity-100'}`}>
            {item.name}
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 -top-8 scale-0 group-hover:scale-100 transition-all duration-150 bg-slate-900 border border-white/10 text-indigo-400 text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap shadow-xl z-50">
            Coming Soon
          </span>
        </div>
      );
    });
  };

  return (
    <>
      {/* Mobile Sticky Header */}
      <header className="md:hidden flex items-center justify-between bg-[#090d22]/90 backdrop-blur-md border-b border-white/5 px-4 py-3.5 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h1 className="text-sm font-black italic uppercase tracking-tighter text-white">
            HUSTLE<span className="text-indigo-500">.NUNN</span>
          </h1>
        </div>
        <button
          onClick={toggleMobile}
          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#050714] border-r border-white/5 transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'md:w-44'
        } ${
          isMobileOpen ? 'translate-x-0 w-44' : '-translate-x-full md:translate-x-0'
        } ${className}`}
      >
        {/* Sidebar Brand Header */}
        <div className={`p-6 border-b border-white/5 flex items-center justify-between ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}>
          <div className={`flex items-center gap-2 ${isCollapsed ? 'md:hidden' : 'opacity-100 transition-opacity duration-300'}`}>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <div>
              <h1 className="text-lg font-black italic uppercase tracking-tighter text-white leading-none">
                HUSTLE<span className="text-indigo-500">.NUNN</span>
              </h1>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Job Tracker
              </p>
            </div>
          </div>
          
          {/* Logo Icon view when collapsed */}
          <div className={`hidden ${isCollapsed ? 'md:flex md:w-9 md:h-9 md:items-center md:justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-black italic uppercase' : 'hidden'}`}>
            H
          </div>

          <button
            onClick={toggleMobile}
            className="md:hidden p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Section: Tracker */}
          <div className="space-y-2">
            <p className={`text-[9px] text-slate-600 font-bold uppercase tracking-widest px-4 mb-3 transition-opacity duration-300 ${isCollapsed ? 'md:opacity-0 md:h-0 overflow-hidden mb-0' : ''}`}>
              Tracker
            </p>
            <nav className="space-y-1.5">
              {renderNavLinks(trackerItems)}
            </nav>
          </div>

          {/* Section: Management */}
          <div className="space-y-2">
            <p className={`text-[9px] text-slate-600 font-bold uppercase tracking-widest px-4 mb-3 transition-opacity duration-300 ${isCollapsed ? 'md:opacity-0 md:h-0 overflow-hidden mb-0' : ''}`}>
              Management
            </p>
            <div className="space-y-1.5">
              {renderDisabledLinks(managementItems)}
            </div>
          </div>
        </div>

        {/* Sidebar User Profile Footer */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'md:justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className={`min-w-0 flex-1 transition-all duration-300 ${isCollapsed ? 'md:hidden opacity-0 w-0' : 'opacity-100'}`}>
              <h4 className="text-xs font-bold text-white truncate leading-tight">Al Fitra Nur</h4>
              <p className="text-[9px] text-slate-500 truncate mt-0.5">Free Account</p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              } catch (err) {
                console.error('Logout failed:', err);
              }
            }}
            className={`flex items-center gap-3 w-full py-2 px-3 rounded-lg text-[10px] font-bold text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent transition cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'md:hidden opacity-0 w-0' : 'opacity-100'}`}>
              Sign Out
            </span>
          </button>

          {/* Collapse Trigger for Desktop */}
          <button
            onClick={toggleSidebar}
            className={`hidden md:flex items-center gap-2 w-full py-2 px-3 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent transition cursor-pointer ${
              isCollapsed ? 'md:justify-center' : ''
            }`}
          >
            {isCollapsed ? (
              <>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="uppercase tracking-wider">Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
