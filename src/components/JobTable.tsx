'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Edit, Trash2, Globe, ExternalLink, AlertTriangle, Eye, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from './BrandIcons';
import { Job } from '@/lib/googleSheets';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { useToast } from './Toast';
import { JobDetailsModal } from './JobDetailsModal';

interface JobTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDeleteSuccess: () => void;
  viewMode?: 'list' | 'card';
}

export function getStatusClass(s?: string) {
  const st = String(s || '').toLowerCase();
  if (st.includes('not started')) return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
  if (st.includes('in progress') || st === 'progress') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (st.includes('psikotes')) return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
  if (st.includes('interview')) return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
  if (st.includes('success') || st === 'done') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (st.includes('failed') || st.includes('declined')) return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
  } catch {
    return '---';
  }
};

export const JobTable: React.FC<JobTableProps> = ({ jobs, onEdit, onDeleteSuccess, viewMode = 'list' }) => {
  const toast = useToast();
  const [sortKey, setSortKey] = useState<'rownum' | 'company' | 'status' | 'startdate'>('startdate');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default newest first
  const [lastGlobalSortKey, setLastGlobalSortKey] = useState<'company' | 'status' | 'startdate'>('startdate');
  const [lastGlobalSortAsc, setLastGlobalSortAsc] = useState<boolean>(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  const [prevJobs, setPrevJobs] = useState(jobs);
  if (jobs !== prevJobs) {
    setPrevJobs(jobs);
    setCurrentPage(1);
  }

  useEffect(() => {
    if (rowToDelete !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [rowToDelete]);

  const handleSort = (key: 'rownum' | 'company' | 'status' | 'startdate') => {
    if (sortKey === key) {
      const nextAsc = !sortAsc;
      setSortAsc(nextAsc);
      if (key !== 'rownum') {
        setLastGlobalSortAsc(nextAsc);
      }
    } else {
      setSortKey(key);
      setSortAsc(true);
      if (key !== 'rownum') {
        setLastGlobalSortKey(key);
        setLastGlobalSortAsc(true);
      }
    }
  };

  // Perform sorting globally based on the last active global key
  const globallySorted = [...jobs].sort((a, b) => {
    if (lastGlobalSortKey === 'startdate') {
      const timeA = a.startdate ? new Date(a.startdate).getTime() : 0;
      const timeB = b.startdate ? new Date(b.startdate).getTime() : 0;
      return lastGlobalSortAsc ? timeA - timeB : timeB - timeA;
    }
    const valA = String(a[lastGlobalSortKey] || '').trim().toLowerCase();
    const valB = String(b[lastGlobalSortKey] || '').trim().toLowerCase();
    return lastGlobalSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const totalPages = Math.ceil(globallySorted.length / itemsPerPage);
  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  const pagedJobs = globallySorted.slice(indexOfFirstJob, indexOfLastJob);

  // Perform sorting on the current page's jobs
  const currentJobs = [...pagedJobs].sort((a, b) => {
    if (sortKey === 'rownum') {
      return sortAsc ? a.rownum - b.rownum : b.rownum - a.rownum;
    }
    return 0; // Keep the global sorted order if not sorting by 'No'
  });

  const handleDelete = async () => {
    if (!rowToDelete) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/jobs/${rowToDelete}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Record and associated file deleted.');
        onDeleteSuccess();
        setRowToDelete(null);
      } else {
        toast.error(result.error || 'Failed to delete record.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error during deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden">
        {viewMode === 'card' ? (
          /* Grid Card View (Desktop & Mobile) */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-1">
            {jobs.length === 0 ? (
              <div className="col-span-full p-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
                Zero applications found.
              </div>
            ) : (
              currentJobs.map((item, index) => {
                const overallIndex = indexOfFirstJob + index;
                const displayNo = sortAsc ? overallIndex + 1 : jobs.length - overallIndex;
                const locationString = item.province && item.city 
                  ? `${item.city}, ${item.province}` 
                  : item.city || item.province || 'Luar Daerah';

                return (
                  <div key={item.id || item.rownum} className="bg-white/5 border border-white/5 p-5 rounded-3xl flex flex-col justify-between gap-4 hover:bg-white/[0.08] transition duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">No. {displayNo}</div>
                        <div className="text-md font-black text-indigo-400 mt-0.5 leading-tight">{item.company}</div>
                        <div className="text-[9px] text-slate-400 font-bold capitalize mt-0.5">{item.kategori || 'Uncategorized'}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                      <div className="flex justify-between border-b border-white/[0.03] pb-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Location:</span>
                        <span className="text-[10px] flex items-center gap-1 font-medium text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {locationString}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-white/[0.03] pb-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Platform & Level:</span>
                        <span className="text-[10px] font-medium text-slate-300">
                          {item.platform || 'Other'} ({item.careerlevel || '-'})
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-white/[0.03] pb-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Stage:</span>
                        <span className="text-[10px] font-bold text-indigo-400">
                          {item.currentstage || 'Not Started'}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-white/[0.03] pb-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Applied Date:</span>
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          {formatDate(item.startdate)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Links:</span>
                        <div className="flex gap-3 items-center">
                          {item.instagram && (
                            <a href={ensureAbsoluteUrl(item.instagram)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-pink-500 transition">
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.linkedin && (
                            <a href={ensureAbsoluteUrl(item.linkedin)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-500 transition">
                              <LinkedinIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.web && (
                            <a href={ensureAbsoluteUrl(item.web)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 transition">
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {!item.instagram && !item.linkedin && !item.web && <span className="text-[10px] text-slate-700 font-bold">-</span>}
                        </div>
                      </div>

                      {item.note && (
                        <div className="mt-1 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 block mb-1">Notes</span>
                          <p className="text-[10px] text-slate-400 leading-normal line-clamp-3" title={item.note}>{item.note}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                      <div>
                        {item.buktiurl && item.buktiurl !== 'No File' ? (
                          <a href={ensureAbsoluteUrl(item.buktiurl)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                            <ExternalLink className="w-3.5 h-3.5" /> View Proof
                          </a>
                        ) : (
                          <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">No Proof</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedJobForDetails(item)} className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        <button onClick={() => onEdit(item)} className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => setRowToDelete(item.rownum)} className="text-slate-500 hover:text-red-500 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            {/* Table View (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
            <thead className="text-slate-500 uppercase text-[9px] font-bold tracking-widest bg-slate-900/50">
              <tr className="border-b border-white/5">
                <th
                  onClick={() => handleSort('rownum')}
                  className="p-4 w-12 text-center cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    # <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('company')}
                  className="p-4 cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center gap-1">
                    Company <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4">Position</th>
                <th className="p-4">Location</th>
                <th className="p-4">Platform</th>
                <th
                  onClick={() => handleSort('status')}
                  className="p-4 text-center w-28 cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-center">Stage</th>
                <th className="p-4 text-center">Level</th>
                <th
                  onClick={() => handleSort('startdate')}
                  className="p-4 w-28 cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    Applied <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
                    Zero applications found.
                  </td>
                </tr>
              ) : (
                currentJobs.map((item, index) => {
                  const overallIndex = indexOfFirstJob + index;
                  const displayNo = sortAsc ? overallIndex + 1 : jobs.length - overallIndex;
                  
                  // Location string builder
                  const locationString = item.province && item.city 
                    ? `${item.city}, ${item.province}` 
                    : item.city || item.province || '-';

                  return (
                    <tr key={item.id || item.rownum} className="hover:bg-white/5 border-b border-white/5 group transition duration-300">
                      <td className="p-4 text-center text-slate-500 font-bold text-[11px]">{displayNo}.</td>
                      <td className="p-4">
                        <div className="font-extrabold text-indigo-400 leading-tight">{item.company}</div>
                        <div className="flex gap-2.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.instagram && (
                            <a href={ensureAbsoluteUrl(item.instagram)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-pink-500 transition">
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.linkedin && (
                            <a href={ensureAbsoluteUrl(item.linkedin)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-500 transition">
                              <LinkedinIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.web && (
                            <a href={ensureAbsoluteUrl(item.web)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 transition">
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-300 text-xs">{item.kategori || '-'}</td>
                      <td className="p-4 text-slate-400 text-xs truncate max-w-[140px]" title={locationString}>
                        {locationString}
                      </td>
                      <td className="p-4 text-xs">
                        <span className="bg-slate-900 border border-white/5 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.platform || 'Other'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-slate-900/50 border border-white/5 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {item.currentstage || 'Not Started'}
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs text-slate-400">
                        {item.careerlevel && item.careerlevel !== 'Not Specified' ? item.careerlevel : '-'}
                      </td>
                      <td className="p-4 text-center font-mono text-xs text-slate-500 font-semibold">
                        {formatDate(item.startdate)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <button onClick={() => setSelectedJobForDetails(item)} className="text-slate-500 hover:text-indigo-400 transition cursor-pointer" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(item)} className="text-slate-500 hover:text-indigo-400 transition cursor-pointer" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRowToDelete(item.rownum)} className="text-slate-500 hover:text-red-500 transition cursor-pointer" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Card View (Mobile) */}
        <div className="block md:hidden divide-y divide-white/5">
          {jobs.length === 0 ? (
            <div className="p-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
              Zero applications found.
            </div>
          ) : (
            currentJobs.map((item, index) => {
              const overallIndex = indexOfFirstJob + index;
              const displayNo = sortAsc ? overallIndex + 1 : jobs.length - overallIndex;
              const locationString = item.province && item.city 
                ? `${item.city}, ${item.province}` 
                : item.city || item.province || 'Luar Daerah';

              return (
                <div key={item.id || item.rownum} className="p-5 hover:bg-white/5 transition flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">No. {displayNo}</div>
                      <div className="text-md font-black text-indigo-400 mt-0.5">{item.company}</div>
                      <div className="text-[9px] text-slate-400 font-bold capitalize mt-0.5">{item.kategori || 'Uncategorized'}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Location:</span>
                      <span className="text-[10px] flex items-center gap-1 font-medium text-slate-300">
                        <MapPin className="w-3 h-3 text-indigo-400" /> {locationString}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Platform & Level:</span>
                      <span className="text-[10px] font-medium text-slate-300">
                        {item.platform || 'Other'} ({item.careerlevel || '-'})
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Stage:</span>
                      <span className="text-[10px] font-bold text-indigo-400">
                        {item.currentstage || 'Not Started'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Applied Date:</span>
                      <span className="text-[10px] font-mono font-bold text-slate-300">
                        {formatDate(item.startdate)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Links:</span>
                      <div className="flex gap-3 items-center">
                        {item.instagram && (
                          <a href={ensureAbsoluteUrl(item.instagram)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-pink-500">
                            <InstagramIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {item.linkedin && (
                          <a href={ensureAbsoluteUrl(item.linkedin)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-500">
                            <LinkedinIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {item.web && (
                          <a href={ensureAbsoluteUrl(item.web)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400">
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!item.instagram && !item.linkedin && !item.web && <span className="text-[10px] text-slate-700 font-bold">-</span>}
                      </div>
                    </div>

                    {item.note && (
                      <div className="mt-1 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 block mb-1">Notes</span>
                        <p className="text-[10px] text-slate-300 leading-normal whitespace-pre-wrap">{item.note}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                    <div>
                      {item.buktiurl && item.buktiurl !== 'No File' ? (
                        <a href={ensureAbsoluteUrl(item.buktiurl)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                          <ExternalLink className="w-3 h-3" /> View Proof
                        </a>
                      ) : (
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">No Proof attached</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedJobForDetails(item)} className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                      <button onClick={() => onEdit(item)} className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setRowToDelete(item.rownum)} className="text-slate-500 hover:text-red-500 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-900/30 border-t border-white/5 gap-4">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Showing <span className="text-white">{indexOfFirstJob + 1}</span> to{' '}
              <span className="text-white">{Math.min(indexOfLastJob, jobs.length)}</span> of{' '}
              <span className="text-white">{jobs.length}</span> applications
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    currentPage === page
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {rowToDelete !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[1.5rem] p-7 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-black font-extrabold text-[13px] leading-relaxed mb-8 px-2 uppercase tracking-wide">
              Hapus data ini? File di folder Drive juga akan terhapus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRowToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-black font-black py-3.5 rounded-xl transition text-[10px] uppercase tracking-wider"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3.5 rounded-xl transition text-[10px] uppercase tracking-wider shadow-lg shadow-red-500/20"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Processing...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Job Details Modal */}
      <JobDetailsModal
        isOpen={selectedJobForDetails !== null}
        onClose={() => setSelectedJobForDetails(null)}
        job={selectedJobForDetails}
      />
    </>
  );
};
