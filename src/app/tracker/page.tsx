'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { 
  Plus, 
  RotateCw, 
  Search, 
  X, 
  ChevronDown, 
  Calendar, 
  Layers,
  LayoutGrid
} from 'lucide-react';
import { Job } from '@/lib/googleSheets';
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

const CAREER_LEVELS = [
  'Internship', 
  'Entry Level / Junior', 
  'Associate / Mid-Senior', 
  'Senior', 
  'Lead / Manager', 
  'Director / Executive', 
  'Not Specified'
];

export default function TrackerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/jobs', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const jobs: Job[] = data?.data || [];

  const uniqueProvinces = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.province).filter((p): p is string => typeof p === 'string' && p.trim() !== ''))).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
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

      // 2.5. Stage filter
      if (stageFilter) {
        const jobStage = (job.currentstage || '').toLowerCase();
        const filterStage = stageFilter.toLowerCase();
        if (jobStage !== filterStage) return false;
      }

      // 2.7. Province (Location) filter
      if (provinceFilter) {
        const jobProv = (job.province || '').toLowerCase();
        if (jobProv !== provinceFilter.toLowerCase()) return false;
      }

      // 2.8. Career Level (Level) filter
      if (levelFilter) {
        const jobLvl = (job.careerlevel || '').toLowerCase();
        if (jobLvl !== levelFilter.toLowerCase()) return false;
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
  }, [jobs, searchQuery, statusFilter, stageFilter, provinceFilter, levelFilter, startDateFilter, endDateFilter]);

  const handleEdit = (job: Job) => {
    setJobToEdit(job);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setJobToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-grow space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/10">
              TraKerja
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              / Track Progress
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase italic">
            Track Progress
            <span className="bg-indigo-500/15 text-indigo-400 text-[9px] not-italic font-black tracking-widest px-2 py-0.5 rounded-md border border-indigo-500/20">
              TRACKER
            </span>
          </h2>
          <p className="text-slate-500 text-[11px] font-medium mt-1">
            Manage and update your active job applications across all recruitment stages.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="w-full md:w-auto btn-gradient px-6 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Application
        </button>
      </div>

      {/* View Switchers (List / Card) */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> List
          </button>
          
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'card'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Card View
          </button>
        </div>
      </div>

      {/* Feed Panel / Table Container */}
      <div className="glass rounded-[2rem] overflow-hidden">
        {/* Filters bar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center p-5 border-b border-white/5 gap-4">
          <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest whitespace-nowrap">
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

            {/* Stage Filter */}
            <div className="relative flex-grow sm:flex-grow-0">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full sm:w-36 bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-3 pr-8 text-xs focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition cursor-pointer appearance-none text-slate-300"
              >
                <option value="" className="bg-[#0f172a] text-slate-400">All Stages</option>
                <option value="Not Started" className="bg-[#0f172a] text-white">Not Started</option>
                <option value="Document Screening" className="bg-[#0f172a] text-white">Document Screening</option>
                <option value="Online Test" className="bg-[#0f172a] text-white">Online Test</option>
                <option value="Technical Test" className="bg-[#0f172a] text-white">Technical Test</option>
                <option value="Psikotes" className="bg-[#0f172a] text-white">Psikotes</option>
                <option value="HR Interview" className="bg-[#0f172a] text-white">HR Interview</option>
                <option value="User Interview" className="bg-[#0f172a] text-white">User Interview</option>
                <option value="Presentation Round" className="bg-[#0f172a] text-white">Presentation Round</option>
                <option value="Offering Letter" className="bg-[#0f172a] text-white">Offering Letter</option>
                <option value="Contract Signed / Done" className="bg-[#0f172a] text-white">Contract Signed / Done</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Location (Province) Filter */}
            <div className="relative flex-grow sm:flex-grow-0">
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="w-full sm:w-36 bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-3 pr-8 text-xs focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition cursor-pointer appearance-none text-slate-300"
              >
                <option value="" className="bg-[#0f172a] text-slate-400">All Locations</option>
                {uniqueProvinces.map((prov) => (
                  <option key={prov} value={prov} className="bg-[#0f172a] text-white">
                    {prov.replace('Daerah Khusus Ibukota ', '').replace('Daerah Istimewa ', '')}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Level Filter */}
            <div className="relative flex-grow sm:flex-grow-0">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full sm:w-36 bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-3 pr-8 text-xs focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition cursor-pointer appearance-none text-slate-300"
              >
                <option value="" className="bg-[#0f172a] text-slate-400">All Levels</option>
                {CAREER_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-[#0f172a] text-white">
                    {lvl}
                  </option>
                ))}
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
            {(searchQuery || statusFilter || stageFilter || provinceFilter || levelFilter || startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setStageFilter('');
                  setProvinceFilter('');
                  setLevelFilter('');
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

        {/* Job Table View */}
        <JobTable
          jobs={filteredJobs}
          onEdit={handleEdit}
          onDeleteSuccess={mutate}
          viewMode={viewMode}
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
