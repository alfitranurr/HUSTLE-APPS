'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Job } from '@/lib/googleSheets';

interface DashboardChartsProps {
  jobs: Job[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ jobs }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass h-64 rounded-3xl animate-pulse" />
        <div className="glass h-64 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // 1. Prepare Status Distribution Data
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
      // Fallback matching
      const lower = s.toLowerCase();
      if (lower.includes('not started')) statusCounts['Not Started']++;
      else if (lower.includes('in progress')) statusCounts['In Progress']++;
      else if (lower.includes('success')) statusCounts['Success']++;
      else if (lower.includes('failed')) statusCounts['Failed']++;
    }
  });

  const statusData = [
    { name: 'Not Started', value: statusCounts['Not Started'], color: '#facc15' }, // Yellow-400
    { name: 'In Progress', value: statusCounts['In Progress'], color: '#818cf8' }, // Indigo-400
    { name: 'Success', value: statusCounts['Success'], color: '#34d399' },     // Emerald-400
    { name: 'Failed', value: statusCounts['Failed'], color: '#f87171' },       // Red-400
  ].filter(d => d.value > 0);

  // 2. Prepare Category Breakdown Data (Top 5 Categories)
  const categoryMap: { [key: string]: number } = {};
  jobs.forEach((job) => {
    const cat = (job.kategori || 'Uncategorized').trim();
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Status Distribution Donut */}
      <div className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[300px]">
        <div>
          <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1">Status Distribution</h3>
          <p className="text-slate-500 text-[9px] uppercase tracking-wider">Breakdown of application phases</p>
        </div>
        
        <div className="h-44 w-full relative flex items-center justify-center">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  cornerRadius={4}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-xs text-slate-500 font-bold italic uppercase">No active records for charts</span>
          )}

          {/* Centered Total Count */}
          {statusData.length > 0 && (
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Active</span>
              <span className="text-3xl font-black text-white">{jobs.length}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 flex-wrap text-[9px] font-bold uppercase text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block" />
            <span>Not Started ({statusCounts['Not Started']})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 block" />
            <span>In Progress ({statusCounts['In Progress']})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
            <span>Success ({statusCounts['Success']})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
            <span>Failed ({statusCounts['Failed']})</span>
          </div>
        </div>
      </div>

      {/* Top Categories Bar Chart */}
      <div className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[300px]">
        <div>
          <h3 className="font-bold text-white uppercase text-[10px] tracking-widest mb-1">Top Categories</h3>
          <p className="text-slate-500 text-[9px] uppercase tracking-wider">Distribution of applications by field</p>
        </div>

        <div className="h-48 w-full mt-4">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs text-slate-500 font-bold italic uppercase">No categories recorded</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
