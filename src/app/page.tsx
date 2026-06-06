'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Plus, RotateCw, Briefcase, Play, CheckCircle2, XCircle, Search, X, ChevronDown, Calendar, ArrowUp } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // SWR for automatic revalidation and caching
  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/jobs', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const jobs: Job[] = data?.data || [];
  const filteredJobs = jobs.filter((job) => {
    // 1. Search Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        (job.company || '').toLowerCase().includes(query) ||
        (job.kategori || '').toLowerCase().includes(query) ||
        (job.status || '').toLowerCase().includes(query) ||
        (job.note || '').toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // 2. Status filter
    if (statusFilter) {
      const jobStatus = (job.status || '').toLowerCase();
      const filterStatus = statusFilter.toLowerCase();
      
      const isMatch = jobStatus === filterStatus || 
                      (filterStatus === 'success' && jobStatus === 'done') ||
                      (filterStatus === 'in progress' && jobStatus === 'progress');
                      
      if (!isMatch) return false;
    }

    // 3. Date range filter
    if (startDateFilter || endDateFilter) {
      if (!job.startdate) return false;
      const jobTime = new Date(job.startdate).getTime();
      if (isNaN(jobTime)) return false;

      if (startDateFilter) {
        const startTime = new Date(startDateFilter + 'T00:00:00').getTime();
        if (jobTime < startTime) return false;
      }
      if (endDateFilter) {
        const endTime = new Date(endDateFilter + 'T23:59:59').getTime();
        if (jobTime > endTime) return false;
      }
    }

    return true;
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
      <div className="mb-12 glass rounded-[2rem] overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center p-5 border-b border-white/5 gap-4">
          <h3 className="font-bold text-white uppercase text-[10px] tracking-widest whitespace-nowrap">
            Application Feed
          </h3>
          <div className="flex flex-wrap items-center gap-3 flex-grow lg:flex-grow-0">
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

            {/* Status Filter */}
            <div className="relative flex-grow sm:flex-grow-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-36 bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-3 pr-8 text-xs focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition cursor-pointer appearance-none text-slate-300"
              >
                <option value="" className="bg-[#0f172a] text-slate-400">All Status</option>
                <option value="Not Started" className="bg-[#0f172a] text-white">🟡 Not Started</option>
                <option value="In Progress" className="bg-[#0f172a] text-white">🔵 In Progress</option>
                <option value="Success" className="bg-[#0f172a] text-white">🟢 Success</option>
                <option value="Failed" className="bg-[#0f172a] text-white">🔴 Failed</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-grow sm:flex-grow-0">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none w-28 [color-scheme:dark] cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
              <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">to</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none w-28 [color-scheme:dark] cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || statusFilter || startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-red-400 hover:text-white transition cursor-pointer uppercase tracking-wider py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}

            {/* Sync Database Button */}
            <button
              onClick={() => mutate()}
              disabled={isLoading || isValidating}
              className="flex items-center justify-center gap-2 text-[9px] font-bold text-indigo-400 hover:text-white transition disabled:opacity-50 cursor-pointer uppercase tracking-wider bg-white/5 lg:bg-transparent py-2.5 lg:py-0 px-4 lg:px-0 rounded-xl lg:rounded-none border border-white/10 lg:border-none whitespace-nowrap"
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

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 bg-slate-900/60 hover:bg-indigo-600/95 backdrop-blur-md border border-white/10 hover:border-indigo-500/50 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer ${
          showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
      </button>
    </main>
  );
}
