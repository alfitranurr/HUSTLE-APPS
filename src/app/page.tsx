'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, RotateCw, Briefcase, Play, CheckCircle2, XCircle, Search, X } from 'lucide-react';
import { Job } from '@/lib/googleSheets';
import { DashboardCharts } from '@/components/DashboardCharts';
import { JobTable } from '@/components/JobTable';
import { JobFormModal } from '@/components/JobFormModal';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch data');
  }
  return res.json();
};

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // SWR for automatic revalidation and caching
  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/jobs', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const jobs: Job[] = data?.data || [];
  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (job.company || '').toLowerCase().includes(query) ||
      (job.kategori || '').toLowerCase().includes(query) ||
      (job.status || '').toLowerCase().includes(query) ||
      (job.note || '').toLowerCase().includes(query)
    );
  });
  const stats = data?.stats || {
    total: 0,
    notstarted: 0,
    progress: 0,
    success: 0,
    failed: 0,
  };

  const handleEdit = (job: Job) => {
    setJobToEdit(job);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setJobToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-grow">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            HUSTLE<span className="text-indigo-500">.NUNN</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
            Don't Give Up Until You Get Hired.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="btn-gradient px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {/* Total */}
        <div className="glass p-5 rounded-3xl text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition duration-300">
            <Briefcase className="w-12 h-12 text-white" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Total</p>
          <h2 className="text-3xl font-black text-white leading-none">
            {isLoading ? '...' : stats.total}
          </h2>
        </div>

        {/* Not Started */}
        <div className="glass p-5 rounded-3xl text-center border-l-4 border-yellow-500 relative overflow-hidden group">
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Not Started</p>
          <h2 className="text-3xl font-black text-yellow-400 leading-none">
            {isLoading ? '...' : stats.notstarted}
          </h2>
        </div>

        {/* In Progress */}
        <div className="glass p-5 rounded-3xl text-center border-l-4 border-indigo-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition duration-300">
            <Play className="w-12 h-12 text-indigo-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">In Progress</p>
          <h2 className="text-3xl font-black text-indigo-400 leading-none">
            {isLoading ? '...' : stats.progress}
          </h2>
        </div>

        {/* Success */}
        <div className="glass p-5 rounded-3xl text-center border-l-4 border-green-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Success</p>
          <h2 className="text-3xl font-black text-green-400 leading-none">
            {isLoading ? '...' : stats.success}
          </h2>
        </div>

        {/* Failed */}
        <div className="glass p-5 rounded-3xl text-center border-l-4 border-red-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition duration-300">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Failed</p>
          <h2 className="text-3xl font-black text-red-400 leading-none">
            {isLoading ? '...' : stats.failed}
          </h2>
        </div>
      </div>

      {/* Analytics Visualization Section */}
      <DashboardCharts jobs={jobs} />

      {/* Feed Panel */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white/5 border border-white/5 border-b-0 p-5 rounded-t-[2rem] backdrop-blur-md gap-4">
          <h3 className="font-bold text-white uppercase text-[10px] tracking-widest whitespace-nowrap">
            Application Feed
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow sm:flex-grow-0">
            {/* Search Input */}
            <div className="relative flex-grow sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari perusahaan, kategori, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 pl-9 pr-9 text-xs focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Sync Database Button */}
            <button
              onClick={() => mutate()}
              disabled={isLoading || isValidating}
              className="flex items-center justify-center gap-2 text-[9px] font-bold text-indigo-400 hover:text-white transition disabled:opacity-50 cursor-pointer uppercase tracking-wider bg-white/5 sm:bg-transparent py-2.5 sm:py-0 px-4 sm:px-0 rounded-xl sm:rounded-none border border-white/10 sm:border-none whitespace-nowrap"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
              Sync Database
            </button>
          </div>
        </div>

        <JobTable
          jobs={filteredJobs}
          onEdit={handleEdit}
          onDeleteSuccess={mutate}
        />
      </div>

      {/* Form Modal */}
      <JobFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobToEdit={jobToEdit}
        onSuccess={mutate}
      />
    </main>
  );
}
