'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { 
  BarChart3, 
  RotateCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Users, 
  TrendingUp,
  Award
} from 'lucide-react';
import { Job } from '@/lib/googleSheets';
import { DashboardCharts } from '@/components/DashboardCharts';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch data');
  }
  return res.json();
};

export default function SummaryPage() {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('all-time');

  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/jobs', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const jobs: Job[] = data?.data || [];

  const statsSummary = useMemo(() => {
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

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl 2xl:max-w-[1600px] mx-auto w-full flex-grow space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase italic">
            Analytics Summary
            <span className="bg-indigo-500/15 text-indigo-400 text-[9px] not-italic font-black tracking-widest px-2 py-0.5 rounded-md border border-indigo-500/20">
              OVERVIEW
            </span>
          </h2>
          <p className="text-slate-500 text-[11px] font-medium mt-1">
            Comprehensive, data-driven insights into your job search trajectory.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto">
          {/* Timeframe Toggles */}
          <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 gap-1 flex-grow md:flex-grow-0 justify-around md:justify-start">
            {(['weekly', 'monthly', 'all-time'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition cursor-pointer ${
                  timeframe === t
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all-time' ? 'All Time' : t}
              </button>
            ))}
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

      {/* 4-Card Analytics Overview Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On Process */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 animate-pulse" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <Play className="w-12 h-12 text-indigo-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">On Process</p>
          <p className="text-[9px] text-slate-600 font-medium -mt-1 mb-1">Active Apps</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : statsSummary.onProcess}
          </h2>
        </div>

        {/* Success */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Success</p>
          <p className="text-[9px] text-slate-600 font-medium -mt-1 mb-1">Offers & Recs</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : statsSummary.success}
          </h2>
        </div>

        {/* Declined */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Declined</p>
          <p className="text-[9px] text-slate-600 font-medium -mt-1 mb-1">Rejected</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : statsSummary.declined}
          </h2>
        </div>

        {/* Interviews */}
        <div className="glass p-5 rounded-3xl text-left relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500" />
          <div className="absolute inset-y-0 right-4 flex items-center opacity-5 group-hover:scale-110 transition duration-300">
            <Users className="w-12 h-12 text-purple-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Interviews</p>
          <p className="text-[9px] text-slate-600 font-medium -mt-1 mb-1">Total Scheduled</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : statsSummary.interviews}
          </h2>
        </div>
      </div>

      {/* Analytics Visualization Section */}
      <div className="space-y-6">
        <DashboardCharts jobs={jobs} />
      </div>

      {/* Bottom Insights Card */}
      <div className="glass rounded-[2rem] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Insight Recommendation</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal max-w-xl">
              {statsSummary.interviews > 0 
                ? "You have active interview steps! Practice common behavioral questions and prepare key anecdotes matching the entities' profiles."
                : "Activity looks stable. To increase interview callback rates, consider refining your CV category matching and applying to 2 more jobs this week."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
