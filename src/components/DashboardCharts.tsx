'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LabelList, 
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { Job } from '@/lib/googleSheets';
import { 
  Eye, 
  X, 
  Send, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Layers,
  Building2
} from 'lucide-react';

interface DashboardChartsProps {
  jobs: Job[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ jobs }) => {
  const [mounted, setMounted] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showCategoriesModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCategoriesModal]);

  // A. 12-Month Timeline Activity Data
  const timelineData = useMemo(() => {
    const today = new Date();
    const months: { year: number; month: number; label: string; apps: number; interviews: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label,
        apps: 0,
        interviews: 0
      });
    }

    jobs.forEach((job) => {
      if (job.startdate) {
        const d = new Date(job.startdate);
        if (!isNaN(d.getTime())) {
          const match = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
          if (match) {
            match.apps++;
          }
        }
      }
      
      const isInterview = String(job.currentstage || '').toLowerCase().includes('interview') ||
                          String(job.status || '').toLowerCase().includes('interview');
      if (isInterview) {
        const dateStr = job.enddate || job.startdate;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const match = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
            if (match) {
              match.interviews++;
            }
          }
        }
      }
    });

    return months.map(m => ({
      name: m.label,
      Applications: m.apps,
      Interviews: m.interviews
    }));
  }, [jobs]);


  // C. Status Distribution Data
  const statusCounts = {
    'Not Started': 0,
    'In Progress': 0,
    'Success': 0,
    'Failed': 0,
  };

  jobs.forEach((job) => {
    let s = String(job.status || '').trim();
    if (s.toLowerCase() === 'done') s = 'Success';
    if (s.toLowerCase() === 'progress') s = 'In Progress';
    
    if (s in statusCounts) {
      statusCounts[s as keyof typeof statusCounts]++;
    } else {
      const lower = s.toLowerCase();
      if (lower.includes('not started')) statusCounts['Not Started']++;
      else if (lower.includes('in progress')) statusCounts['In Progress']++;
      else if (lower.includes('success')) statusCounts['Success']++;
      else if (lower.includes('failed')) statusCounts['Failed']++;
      else statusCounts['Not Started']++;
    }
  });

  const statusData = [
    { name: 'Not Started', value: statusCounts['Not Started'], color: '#facc15' }, // Yellow-400
    { name: 'In Progress', value: statusCounts['In Progress'], color: '#818cf8' }, // Indigo-400
    { name: 'Success', value: statusCounts['Success'], color: '#34d399' },         // Emerald-400
    { name: 'Failed', value: statusCounts['Failed'], color: '#f87171' },           // Red-400
  ].sort((a, b) => b.value - a.value);

  // D. Recruitment Stage Breakdown
  const stageCounts: { [key: string]: number } = {
    'Not Started': 0,
    'Document Screening': 0,
    'Online Test': 0,
    'Technical Test': 0,
    'Psikotes': 0,
    'HR Interview': 0,
    'User Interview': 0,
    'Presentation Round': 0,
    'Offering Letter': 0,
    'Contract Signed / Done': 0,
  };

  jobs.forEach((job) => {
    const stage = job.currentstage || 'Not Started';
    if (stage in stageCounts) {
      stageCounts[stage]++;
    } else {
      stageCounts['Not Started']++;
    }
  });

  const stageData = Object.entries(stageCounts)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // E. City Demographics (Accent Bars)
  const cityData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    jobs.forEach((job) => {
      const city = job.city || '-';
      if (city !== '-' && city.trim() !== '') {
        const clean = city.replace('Kota ', '').replace('Kabupaten ', '').replace('Seluruh Provinsi (UMP)', 'UMP');
        counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [jobs]);

  // F. Category Breakdown Data (Top 5 Categories)
  const categoryMap: { [key: string]: number } = {};
  jobs.forEach((job) => {
    const cat = (job.kategori || 'Uncategorized').trim();
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // G. Top Hiring Companies
  const topCompanies = useMemo(() => {
    const counts: { [key: string]: number } = {};
    jobs.forEach((job) => {
      const comp = job.company;
      if (comp) {
        counts[comp] = (counts[comp] || 0) + 1;
      }
    });
    const total = jobs.length;
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(0) : '0'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [jobs]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 shadow-2xl backdrop-blur-md">
          <p className="capitalize">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">


      {/* 3. STATUS, STAGE & CITY BREAKDOWNS (3-Column Accent Bars Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown (Accent Bars) */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1">Status Breakdown</h3>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Application status share</p>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 mt-6">
            {statusData.map((item) => {
              const percentage = jobs.length > 0 ? ((item.value / jobs.length) * 100).toFixed(0) : '0';
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black">{item.value}</span>
                      <span className="text-slate-500 font-mono">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ backgroundColor: item.color, width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Breakdown (Accent Bars) */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1">Stage Breakdown</h3>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Recruitment stage share</p>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 mt-6 pr-1 max-h-[240px] scrollbar-thin">
            {stageData.length > 0 ? (
              stageData.map((item) => {
                const percentage = jobs.length > 0 ? ((item.value / jobs.length) * 100).toFixed(0) : '0';
                return (
                  <div key={item.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-300">
                      <span className="truncate mr-2">{item.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white font-black">{item.value}</span>
                        <span className="text-slate-500 font-mono">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center py-12">
                <span className="text-xs text-slate-500 font-bold italic uppercase">No stage records</span>
              </div>
            )}
          </div>
        </div>

        {/* City Demographics (Accent Bars) */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1">City Demographics</h3>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Urban application distribution</p>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 mt-6 pr-1 max-h-[240px] scrollbar-thin">
            {cityData.length > 0 ? (
              cityData.map((item) => {
                const percentage = jobs.length > 0 ? ((item.value / jobs.length) * 100).toFixed(0) : '0';
                return (
                  <div key={item.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-300">
                      <span className="truncate mr-2">{item.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white font-black">{item.value}</span>
                        <span className="text-slate-500 font-mono">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center py-12">
                <span className="text-xs text-slate-500 font-bold italic uppercase">No city records</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. CATEGORIES & LEADERS (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[340px]">
          <div className="flex justify-between items-start w-full">
            <div>
              <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1">Top Categories</h3>
              <p className="text-slate-500 text-[9px] uppercase tracking-wider">Distribution of applications by field</p>
            </div>
            <button
              onClick={() => setShowCategoriesModal(true)}
              className="text-[9px] font-bold text-indigo-400 hover:text-white uppercase tracking-wider border border-indigo-500/20 hover:border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Details
            </button>
          </div>

          <div className="h-56 w-full mt-4 flex-grow flex items-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={8} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={8} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar 
                    dataKey="value" 
                    fill="url(#barGradient)" 
                    radius={[8, 8, 0, 0]}
                    barSize={20}
                  >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      fill="#e2e8f0" 
                      fontSize={10} 
                      fontWeight="bold"
                      offset={8}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full flex items-center justify-center py-12">
                <span className="text-xs text-slate-500 font-bold italic uppercase">No categories recorded</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Hiring Companies */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[340px]">
          <div>
            <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Top Hiring Companies
            </h3>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Hiring leaderboard</p>
          </div>

          <div className="flex-grow flex flex-col justify-center space-y-3 mt-4 w-full">
            {topCompanies.length > 0 ? (
              topCompanies.map((comp) => (
                <div key={comp.name} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-200 truncate">{comp.name}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{comp.value} APPS</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-indigo-400 shrink-0">{comp.percentage}% <span className="text-[7.5px] text-slate-600 font-bold uppercase ml-0.5 tracking-wide">Share</span></span>
                </div>
              ))
            ) : (
              <div className="w-full text-center text-slate-500 text-xs italic uppercase py-8">No records</div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Activity (Full Width at Bottom) */}
      <div className="glass p-6 rounded-[2rem] flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Timeline Activity
          </h3>
          <p className="text-slate-500 text-[9px] uppercase tracking-wider">Application trends and interview scheduling</p>
        </div>

        <div className="h-64 w-full mt-6">
          {jobs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={8} 
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={8} 
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="Applications" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: '#6366f1', strokeWidth: 1, fill: '#0f172a' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Interviews" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: '#10b981', strokeWidth: 1, fill: '#0f172a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs text-slate-500 font-bold italic uppercase">No timeline data available</span>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 text-[9px] font-black uppercase tracking-wider mt-4">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <span className="w-3 h-1.5 rounded-full bg-[#6366f1]" /> Applications
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-1.5 rounded-full bg-[#10b981]" /> Interviews
          </div>
        </div>
      </div>

      {/* Categories Detail Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-white/10 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
              <div>
                <h2 className="text-md font-black uppercase text-white tracking-wider">
                  Category Breakdown
                </h2>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                  All recorded fields and categories
                </p>
              </div>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="text-slate-500 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-1">
              {Object.entries(categoryMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .map((item, idx) => {
                  const percentage = jobs.length > 0 ? ((item.value / jobs.length) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={item.name} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400 font-mono">#{idx + 1}</span>
                          <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-white">{item.value}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase ml-1.5 tracking-wider">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Total Categories: {Object.keys(categoryMap).length}</span>
              <span>Total Jobs: {jobs.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
