'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { 
  Plus, 
  RotateCw, 
  ChevronRight, 
  Flame, 
  Calendar, 
  Sparkles,
  FileText,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users
} from 'lucide-react';
import { Job } from '@/lib/googleSheets';
import { JobFormModal } from '@/components/JobFormModal';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch data');
  }
  return res.json();
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '---';
  }
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    const datePart = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} - ${timePart}`;
  } catch {
    return '---';
  }
};

// Helper for status classes used in Dashboard Overview
const getOverviewStatusClass = (status?: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'declined' || s === 'failed') return 'bg-red-500/10 text-red-500 border border-red-500/20';
  if (s === 'success' || s === 'done') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
};

const getStageClass = (status?: string) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('interview')) return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
  if (s.includes('psikotes')) return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
  if (s.includes('not started')) return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
};

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/jobs', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const jobs: Job[] = data?.data || [];

  // 1. Calculate Stats
  const stats = useMemo(() => {
    let onProcess = 0;
    let success = 0;
    let declined = 0;
    let interviews = 0;

    jobs.forEach((job) => {
      const s = String(job.status || '').toLowerCase();
      if (s.includes('not started') || s.includes('in progress') || s === 'progress' || s.includes('psikotes')) {
        onProcess++;
      } else if (s.includes('interview')) {
        interviews++;
      } else if (s.includes('success') || s === 'done') {
        success++;
      } else if (s.includes('failed')) {
        declined++;
      }
    });

    return { onProcess, success, declined, interviews };
  }, [jobs]);

  // 2. Filter Recent Applications
  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => {
        const timeA = a.startdate ? new Date(a.startdate).getTime() : 0;
        const timeB = b.startdate ? new Date(b.startdate).getTime() : 0;
        return timeB - timeA; // Descending
      })
      .slice(0, 5);
  }, [jobs]);

  // 3. Filter Upcoming Interviews
  const upcomingInterviews = useMemo(() => {
    const today = new Date().getTime();
    return jobs
      .filter((job) => {
        const stage = String(job.currentstage || '').toLowerCase();
        const isInterviewStage = stage === 'user interview' || stage === 'hr interview';
        if (!isInterviewStage) return false;
        if (!job.enddate) return false;
        const interviewTime = new Date(job.enddate).getTime();
        return !isNaN(interviewTime) && interviewTime >= today;
      })
      .sort((a, b) => new Date(a.enddate).getTime() - new Date(b.enddate).getTime());
  }, [jobs]);

  // 3.5. Filter Upcoming Assessment Tests
  const upcomingAssessments = useMemo(() => {
    const today = new Date().getTime();
    return jobs
      .filter((job) => {
        const stage = String(job.currentstage || '').toLowerCase();
        const isAssessmentStage = stage === 'assessment test';
        if (!isAssessmentStage) return false;
        if (!job.enddate) return false;
        const assessmentTime = new Date(job.enddate).getTime();
        return !isNaN(assessmentTime) && assessmentTime >= today;
      })
      .sort((a, b) => new Date(a.enddate).getTime() - new Date(b.enddate).getTime());
  }, [jobs]);

  // 4. Generate Contribution Heatmap Grid
  const heatmapData = useMemo(() => {
    const today = new Date();
    const grid: { date: Date; count: number; dayOfWeek: number }[] = [];
    
    // Map of jobs by YYYY-MM-DD
    const jobCountsByDate: { [key: string]: number } = {};
    jobs.forEach((job) => {
      if (job.startdate) {
        try {
          const d = new Date(job.startdate);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            jobCountsByDate[key] = (jobCountsByDate[key] || 0) + 1;
          }
        } catch {}
      }
    });

    // We want 53 columns (weeks), starting from 365 days ago aligned to Sunday/Monday
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364); // roughly 52 weeks ago
    const dayOfWeek = startDate.getDay();
    // adjust to start of that week (Sunday = 0)
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const tempDate = new Date(startDate);
    while (tempDate <= today || grid.length < 371) { // 53 weeks * 7 days = 371
      const key = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
      grid.push({
        date: new Date(tempDate),
        count: jobCountsByDate[key] || 0,
        dayOfWeek: tempDate.getDay()
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return grid;
  }, [jobs]);

  // Group heatmap into columns of 7 days
  const heatmapWeeks = useMemo(() => {
    const weeks: { date: Date; count: number; dayOfWeek: number }[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeks.push(heatmapData.slice(i, i + 7));
    }
    return weeks;
  }, [heatmapData]);

  // Calculate monthly labels for heatmap columns
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIdx: number }[] = [];
    let prevMonth = -1;
    heatmapWeeks.forEach((week, colIdx) => {
      const date = week[0]?.date;
      if (date) {
        const curMonth = date.getMonth();
        if (curMonth !== prevMonth) {
          labels.push({
            text: date.toLocaleDateString('en-US', { month: 'short' }),
            colIdx
          });
          prevMonth = curMonth;
        }
      }
    });
    // Filter labels to prevent overlapping
    return labels.filter((_, idx) => idx % 2 === 0 || idx === labels.length - 1);
  }, [heatmapWeeks]);

  const heatmapAverage = useMemo(() => {
    if (jobs.length === 0) return '0.00';
    return (jobs.length / 365).toFixed(2);
  }, [jobs]);

  // Form handlers
  const handleCreateNew = () => {
    setIsModalOpen(true);
  };

  const showNotification = (message: string) => {
    setActiveNotification(message);
    setTimeout(() => setActiveNotification(null), 3000);
  };

  const getDayOfWeekLabel = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-grow space-y-8 animate-fade-in">
      
      {/* Toast Alert */}
      {activeNotification && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl text-[10px] uppercase font-bold text-indigo-400 animate-bounce">
          {activeNotification}
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase italic">
            Dashboard Overview
            <span className="bg-indigo-500/15 text-indigo-400 text-[9px] not-italic font-black tracking-widest px-2 py-0.5 rounded-md border border-indigo-500/20">
              LIVE
            </span>
          </h2>
          <p className="text-slate-500 text-[11px] font-medium mt-1">
            Welcome back, <span className="text-indigo-400 font-bold">Al!</span> Here is your career momentum and tracking progress.
          </p>
        </div>

        {/* Dynamic Date display on right */}
        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {todayDateStr}
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading || isValidating}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition text-slate-400 hover:text-white cursor-pointer shrink-0 disabled:opacity-50"
            title="Sync Database"
          >
            <RotateCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Upcoming Schedules (Assessments & Interviews) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Card 1: Upcoming Assessment Test */}
        <div className="glass rounded-[2rem] p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Upcoming Assessment Test
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Your schedule for the next assessment tests
              </p>
            </div>
            <Link 
              href="/tracker"
              className="text-[9px] text-slate-400 hover:text-white font-black uppercase tracking-wider flex items-center gap-1 transition border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-xl bg-white/5 cursor-pointer"
            >
              View Tracker <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-slate-500 text-xs uppercase tracking-wider font-bold">
              Checking schedule...
            </div>
          ) : upcomingAssessments.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-2.5 border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 border border-white/5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-200 font-extrabold text-[10px] uppercase tracking-wider">No upcoming assessments</p>
                <p className="text-slate-500 text-[9px] mt-0.5 leading-normal">
                  No scheduled assessment tests.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 no-scrollbar">
              {upcomingAssessments.map((item) => (
                <div 
                  key={`assessment-${item.id || item.rownum}`} 
                  className="bg-white/5 border border-white/5 hover:border-cyan-500/30 p-4 rounded-xl transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative group animate-fade-in"
                >
                  <div>
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wide">{item.company}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      {item.kategori || 'Uncategorized'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/5 shrink-0 self-start sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{formatDateTime(item.enddate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Upcoming Interviews */}
        <div className="glass rounded-[2rem] p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Upcoming Interviews
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Your schedule for the next interviews
              </p>
            </div>
            <Link 
              href="/tracker"
              className="text-[9px] text-slate-400 hover:text-white font-black uppercase tracking-wider flex items-center gap-1 transition border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-xl bg-white/5 cursor-pointer"
            >
              View Tracker <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-slate-500 text-xs uppercase tracking-wider font-bold">
              Checking schedule...
            </div>
          ) : upcomingInterviews.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-2.5 border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 border border-white/5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-200 font-extrabold text-[10px] uppercase tracking-wider">No upcoming interviews</p>
                <p className="text-slate-500 text-[9px] mt-0.5 leading-normal">
                  Apply to more jobs to schedule an interview!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 no-scrollbar">
              {upcomingInterviews.map((item) => (
                <div 
                  key={`interview-${item.id || item.rownum}`} 
                  className="bg-white/5 border border-white/5 hover:border-purple-500/30 p-4 rounded-xl transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative group animate-fade-in"
                >
                  <div>
                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-wide">{item.company}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      {item.currentstage || 'Interview Stage'} - {item.kategori || 'Uncategorized'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/5 shrink-0 self-start sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{formatDateTime(item.enddate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Stats Cards Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* ON PROCESS */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <Play className="w-12 h-12 text-blue-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">On Process</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1.5 leading-none">Active Apps</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : stats.onProcess}
          </h2>
        </div>

        {/* SUCCESS */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Success</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1.5 leading-none">Offers & Recs</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : stats.success}
          </h2>
        </div>

        {/* DECLINED */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Declined</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1.5 leading-none">Rejected</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : stats.declined}
          </h2>
        </div>

        {/* INTERVIEWS */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <Users className="w-12 h-12 text-amber-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Interviews</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1.5 leading-none">Total Scheduled</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : stats.interviews}
          </h2>
        </div>
      </div>

      {/* Row 2: Recent Applications & Weekly Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 glass rounded-[2rem] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest">
              Recent Applications
            </h3>
            <Link 
              href="/tracker" 
              className="text-[9px] text-indigo-400 hover:text-white font-black uppercase tracking-wider flex items-center gap-1 transition"
            >
              View Tracker <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-grow overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-slate-500 uppercase text-[9px] font-bold tracking-widest bg-slate-900/30">
                <tr className="border-b border-white/5">
                  <th className="p-4 pl-6">Company</th>
                  <th className="p-4">Position</th>
                  <th className="p-4 text-center">Applied</th>
                  <th className="p-4 text-center">Stage</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold text-xs uppercase tracking-wider">
                      Loading data...
                    </td>
                  </tr>
                ) : recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
                      Zero recent submissions.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((item) => {
                    const stageVal = item.currentstage || 'Not Started';
                    
                    // Map Status Category label
                    const s = String(item.status || '').toLowerCase();
                    let statusLabel = 'ON PROCESS';
                    if (s.includes('failed')) {
                      statusLabel = 'DECLINED';
                    } else if (s.includes('success') || s === 'done') {
                      statusLabel = 'SUCCESS';
                    }

                    return (
                      <tr key={item.id || item.rownum} className="hover:bg-white/5 border-b border-white/5 group transition duration-200">
                        <td className="p-4 pl-6 font-extrabold text-slate-200">{item.company}</td>
                        <td className="p-4 font-medium text-slate-400 capitalize text-xs">{item.kategori || '-'}</td>
                        <td className="p-4 text-center text-xs text-slate-500 font-mono">{formatDate(item.startdate)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStageClass(stageVal)}`}>
                            {stageVal}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getOverviewStatusClass(statusLabel)}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-4 text-center pr-6">
                          <Link 
                            href="/tracker" 
                            className="inline-flex items-center justify-center p-1 hover:text-indigo-400 text-slate-600 transition cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Targets Panel */}
        <div className="glass rounded-[2rem] p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest">
                Weekly Targets
              </h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Cadence
              </span>
            </div>

            <div className="mt-4 bg-white/5 border border-white/5 rounded-2xl p-4 text-center text-[11px] text-slate-400">
              Weekly targets are not active. Set your targets below.
            </div>

            {/* Circular Meters */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* APPLICATIONS */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="32" className="stroke-white/5" strokeWidth="4" fill="transparent" />
                    <circle cx="40" cy="40" r="32" className="stroke-indigo-500" strokeWidth="4" fill="transparent"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 * (1 - Math.min(stats.onProcess / 5, 1))}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-sm font-black text-white">{stats.onProcess}</span>
                    <span className="text-[9px] text-slate-500 block -mt-1">/5</span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Applications</span>
              </div>

              {/* FOLLOW-UPS */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="32" className="stroke-white/5" strokeWidth="4" fill="transparent" />
                    <circle cx="40" cy="40" r="32" className="stroke-cyan-500" strokeWidth="4" fill="transparent"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 * (1 - Math.min(stats.interviews / 3, 1))}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-sm font-black text-white">{stats.interviews}</span>
                    <span className="text-[9px] text-slate-500 block -mt-1">/3</span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Follow-Ups</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {/* Streak Card */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-5 h-5 fill-amber-400/20" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-white leading-tight">1 Day Streak!</h4>
                <p className="text-[9px] text-slate-500 font-medium">Keep updating your applications</p>
              </div>
            </div>

            <button className="w-full py-2.5 rounded-xl border border-white/10 hover:border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center justify-center gap-1.5 cursor-pointer">
              Set Weekly Target <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Row 3: Contribution Heatmap */}
      <div className="w-full glass rounded-[2rem] p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest">
              {jobs.length} Applications Submitted in the Last Year
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Visualizing your daily application consistency over the last 12 months.
            </p>
          </div>
          <span className="bg-slate-900 border border-white/5 px-2.5 py-1 rounded-lg text-[9px] font-black text-slate-400">
            Avg: {heatmapAverage} / day
          </span>
        </div>

        {/* Grid Container */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] flex flex-col gap-2 pt-2">
            
            {/* Month Labels */}
            <div className="flex text-[8px] font-bold text-slate-500 uppercase tracking-widest pl-8 relative h-4">
              {monthLabels.map((lbl) => (
                <span 
                  key={`${lbl.text}-${lbl.colIdx}`} 
                  className="absolute"
                  style={{ left: `${32 + lbl.colIdx * 11}px` }}
                >
                  {lbl.text}
                </span>
              ))}
            </div>

            {/* Grid with Rows */}
            <div className="flex gap-2 items-start">
              {/* Row Labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between text-[8px] font-bold text-slate-600 h-[68px] pt-1">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* Heatmap Squares columns */}
              <div className="flex gap-[3px]">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={`week-${wIdx}`} className="flex flex-col gap-[3px]">
                    {week.map((day, dIdx) => {
                      let cellBg = 'bg-[#1e293b]/20 border border-white/[0.02]';
                      if (day.count === 1) cellBg = 'bg-emerald-500/20 border border-emerald-500/10';
                      else if (day.count === 2) cellBg = 'bg-emerald-500/40 border border-emerald-500/25';
                      else if (day.count === 3) cellBg = 'bg-emerald-500/70 border border-emerald-500/50';
                      else if (day.count > 3) cellBg = 'bg-emerald-400 border border-emerald-300/50';

                      const formattedDateStr = day.date.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      return (
                        <div
                          key={`day-${wIdx}-${dIdx}`}
                          className={`w-2.5 h-2.5 rounded-sm transition-colors duration-150 relative group ${cellBg}`}
                          title={`${day.count} lamaran pada ${formattedDateStr}`}
                        >
                          {/* Simple hover tooltip */}
                          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-100 bg-slate-950 border border-white/10 text-slate-200 text-[8px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                            {day.count} jobs: {formattedDateStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend Footer */}
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-2 pl-8">
              <span className="hover:text-indigo-400 transition cursor-pointer">
                Learn how we track application activity
              </span>
              <div className="flex items-center gap-1">
                <span>Less</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-[#1e293b]/20 border border-white/[0.02]" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/10" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/25" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 border border-emerald-500/50" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-300/50" />
                <span>More</span>
              </div>
            </div>

          </div>
        </div>
      </div>


      {/* Form Modal */}
      <JobFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobToEdit={null}
        onSuccess={mutate}
      />
    </main>
  );
}
