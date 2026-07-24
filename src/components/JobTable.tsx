/* cspell:disable */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  Globe, 
  ExternalLink, 
  AlertTriangle, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  MapPin,
  Calendar
} from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from './BrandIcons';
import { Job } from '@/lib/googleSheets';
import { ensureAbsoluteUrl, getProofUrls } from '@/lib/utils';
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
  if (st.includes('not started')) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (st.includes('in progress') || st === 'progress') return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
  if (st.includes('psikotes')) return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
  if (st.includes('interview')) return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
  if (st.includes('success') || st === 'done') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (st.includes('failed') || st.includes('declined')) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
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
  const [sortAsc, setSortAsc] = useState<boolean>(false);
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

  const currentJobs = [...pagedJobs].sort((a, b) => {
    if (sortKey === 'rownum') {
      return sortAsc ? a.rownum - b.rownum : b.rownum - a.rownum;
    }
    return 0;
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
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.length === 0 ? (
              <div className="col-span-full p-16 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] italic">
                Zero applications found.
              </div>
            ) : (
              currentJobs.map((item, index) => {
                const overallIndex = indexOfFirstJob + index;
                const displayNo = sortAsc ? overallIndex + 1 : jobs.length - overallIndex;
                const locationString = item.province && item.city 
                  ? `${item.city}, ${item.province}` 
                  : item.city || item.province || 'Luar Daerah';

                const hasLinks = item.instagram || item.linkedin || item.web || item.otherlink;

                return (
                  <div 
                    key={item.id || item.rownum} 
                    className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 rounded-xl p-4 shadow-lg transition-all duration-300 flex flex-col justify-between gap-3 group"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="bg-indigo-500/10 text-indigo-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/20">
                            #{displayNo}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold capitalize truncate">
                            {item.kategori || 'Uncategorized'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors leading-snug truncate" title={item.company}>
                          {item.company}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Meta Fields */}
                    <div className="space-y-1.5 text-[11px] text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-white/5">
                      {/* Location */}
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">Location</span>
                          <span className="text-[10px] font-semibold text-slate-200 leading-tight block break-words" title={locationString}>
                            {locationString}
                          </span>
                        </div>
                      </div>

                      {/* Platform & Stage */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">Platform / Level</span>
                          <span className="text-[10px] font-semibold text-slate-300 truncate block">
                            {item.platform || 'Other'} <span className="text-slate-500">({item.careerlevel || '-'})</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">Current Stage</span>
                          <span className="text-[10px] font-bold text-indigo-400 truncate block">
                            {item.currentstage || 'Not Started'}
                          </span>
                        </div>
                      </div>

                      {/* Applied Date & Links */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 items-center">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">Applied Date</span>
                          <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {formatDate(item.startdate)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block mb-0.5">Links</span>
                          {hasLinks ? (
                            <div className="flex items-center gap-1.5">
                              {item.instagram && (
                                <a 
                                  href={ensureAbsoluteUrl(item.instagram)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1 rounded bg-white/5 hover:bg-pink-500/20 text-slate-400 hover:text-pink-400 transition"
                                  title="Instagram"
                                >
                                  <InstagramIcon className="w-3 h-3" />
                                </a>
                              )}
                              {item.linkedin && (
                                <a 
                                  href={ensureAbsoluteUrl(item.linkedin)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1 rounded bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition"
                                  title="LinkedIn"
                                >
                                  <LinkedinIcon className="w-3 h-3" />
                                </a>
                              )}
                              {item.web && (
                                <a 
                                  href={ensureAbsoluteUrl(item.web)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1 rounded bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition"
                                  title="Website"
                                >
                                  <Globe className="w-3 h-3" />
                                </a>
                              )}
                              {item.otherlink && (
                                <a 
                                  href={ensureAbsoluteUrl(item.otherlink)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1 rounded bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition"
                                  title="Other Link"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-600 font-medium">-</span>
                          )}
                        </div>
                      </div>

                      {/* Notes Preview */}
                      {item.note && (
                        <div className="pt-1.5 border-t border-white/5">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block mb-0.5">Notes</span>
                          <p className="text-[9px] text-slate-300 leading-normal line-clamp-2 whitespace-pre-wrap font-normal" title={item.note}>
                            {item.note}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div>
                        {(() => {
                          const proofUrls = getProofUrls(item.buktiurl);
                          if (proofUrls.length === 0) {
                            return <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">No Proof</span>;
                          }
                          if (proofUrls.length === 1) {
                            return (
                              <a 
                                href={ensureAbsoluteUrl(proofUrls[0])} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold transition"
                              >
                                <ExternalLink className="w-3 h-3" /> Proof
                              </a>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1 flex-wrap">
                              {proofUrls.map((url, idx) => (
                                <a 
                                  key={idx}
                                  href={ensureAbsoluteUrl(url)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold transition"
                                  title={`Proof #${idx + 1}`}
                                >
                                  <ExternalLink className="w-3 h-3" /> #{idx + 1}
                                </a>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedJobForDetails(item)} 
                          className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" /> Details
                        </button>
                        <button 
                          onClick={() => onEdit(item)} 
                          className="p-1 rounded bg-white/5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => setRowToDelete(item.rownum)} 
                          className="p-1 rounded bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
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
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase text-[8px] font-bold tracking-widest bg-slate-950/60 border-b border-white/10">
                  <tr>
                    <th
                      onClick={() => handleSort('rownum')}
                      className="p-3 w-10 text-center cursor-pointer hover:text-indigo-400 transition"
                    >
                      <div className="flex items-center justify-center gap-1">
                        # <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('company')}
                      className="p-3 cursor-pointer hover:text-indigo-400 transition"
                    >
                      <div className="flex items-center gap-1">
                        Company <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3">Position</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-center min-w-[100px]">Platform</th>
                    <th
                      onClick={() => handleSort('status')}
                      className="p-3 text-center min-w-[110px] cursor-pointer hover:text-indigo-400 transition"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Status <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3 text-center min-w-[130px]">Stage</th>
                    <th className="p-3 text-center">Level</th>
                    <th
                      onClick={() => handleSort('startdate')}
                      className="p-3 w-24 cursor-pointer hover:text-indigo-400 transition"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Applied <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-16 text-center text-slate-500 font-bold uppercase tracking-widest text-[9px] italic">
                        Zero applications found.
                      </td>
                    </tr>
                  ) : (
                    currentJobs.map((item, index) => {
                      const overallIndex = indexOfFirstJob + index;
                      const displayNo = sortAsc ? overallIndex + 1 : jobs.length - overallIndex;
                      
                      const locationString = item.province && item.city 
                        ? `${item.city}, ${item.province}` 
                        : item.city || item.province || '-';

                      return (
                        <tr key={item.id || item.rownum} className="hover:bg-white/[0.04] border-b border-white/5 transition duration-200">
                          <td className="p-3 text-center text-slate-500 font-mono font-bold text-[10px]">{displayNo}.</td>
                          <td className="p-3">
                            <div className="font-bold text-indigo-300 leading-tight text-xs">{item.company}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {item.instagram && (
                                <a 
                                  href={ensureAbsoluteUrl(item.instagram)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-0.5 rounded bg-white/5 hover:bg-pink-500/20 text-slate-400 hover:text-pink-400 transition"
                                  title="Instagram"
                                >
                                  <InstagramIcon className="w-3 h-3" />
                                </a>
                              )}
                              {item.linkedin && (
                                <a 
                                  href={ensureAbsoluteUrl(item.linkedin)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-0.5 rounded bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition"
                                  title="LinkedIn"
                                >
                                  <LinkedinIcon className="w-3 h-3" />
                                </a>
                              )}
                              {item.web && (
                                <a 
                                  href={ensureAbsoluteUrl(item.web)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-0.5 rounded bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition"
                                  title="Website"
                                >
                                  <Globe className="w-3 h-3" />
                                </a>
                              )}
                              {item.otherlink && (
                                <a 
                                  href={ensureAbsoluteUrl(item.otherlink)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition"
                                  title="Other Link"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-200 text-[11px]">{item.kategori || '-'}</td>
                          <td className="p-3 text-slate-300 text-[11px] leading-tight break-words max-w-[180px]" title={locationString}>
                            {locationString}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center justify-center whitespace-nowrap bg-slate-900 border border-white/10 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold">
                              {item.platform || 'Other'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center justify-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusClass(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center justify-center whitespace-nowrap bg-slate-900/80 border border-white/5 text-slate-300 px-2.5 py-0.5 rounded text-[9px] font-semibold">
                              {item.currentstage || 'Not Started'}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[10px] text-slate-400 font-medium">
                            {item.careerlevel && item.careerlevel !== 'Not Specified' ? item.careerlevel : '-'}
                          </td>
                          <td className="p-3 text-center font-mono text-[10px] text-slate-400 font-bold">
                            {formatDate(item.startdate)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => setSelectedJobForDetails(item)} 
                                className="p-1 rounded hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition cursor-pointer" 
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => onEdit(item)} 
                                className="p-1 rounded hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition cursor-pointer" 
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setRowToDelete(item.rownum)} 
                                className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition cursor-pointer" 
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-white/5">
              {jobs.length === 0 ? (
                <div className="p-16 text-center text-slate-500 font-bold uppercase tracking-widest text-[9px] italic">
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
                    <div key={item.id || item.rownum} className="p-4 hover:bg-white/5 transition flex flex-col gap-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">No. {displayNo}</div>
                          <div className="text-sm font-black text-indigo-400 mt-0.5">{item.company}</div>
                          <div className="text-[8px] text-slate-400 font-bold capitalize mt-0.5">{item.kategori || 'Uncategorized'}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Location:</span>
                          <span className="text-[9px] flex items-center gap-1 font-medium text-slate-300">
                            <MapPin className="w-3 h-3 text-indigo-400" /> {locationString}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Platform & Level:</span>
                          <span className="text-[9px] font-medium text-slate-300">
                            {item.platform || 'Other'} ({item.careerlevel || '-'})
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Stage:</span>
                          <span className="text-[9px] font-bold text-indigo-400">
                            {item.currentstage || 'Not Started'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Applied Date:</span>
                          <span className="text-[9px] font-mono font-bold text-slate-300">
                            {formatDate(item.startdate)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Links:</span>
                          <div className="flex gap-1.5 items-center">
                            {item.instagram && (
                              <a href={ensureAbsoluteUrl(item.instagram)} target="_blank" rel="noreferrer" className="p-0.5 rounded bg-white/5 text-slate-400 hover:text-pink-400">
                                <InstagramIcon className="w-3 h-3" />
                              </a>
                            )}
                            {item.linkedin && (
                              <a href={ensureAbsoluteUrl(item.linkedin)} target="_blank" rel="noreferrer" className="p-0.5 rounded bg-white/5 text-slate-400 hover:text-blue-400">
                                <LinkedinIcon className="w-3 h-3" />
                              </a>
                            )}
                            {item.web && (
                              <a href={ensureAbsoluteUrl(item.web)} target="_blank" rel="noreferrer" className="p-0.5 rounded bg-white/5 text-slate-400 hover:text-indigo-400" title="Website">
                                <Globe className="w-3 h-3" />
                              </a>
                            )}
                            {item.otherlink && (
                              <a href={ensureAbsoluteUrl(item.otherlink)} target="_blank" rel="noreferrer" className="p-0.5 rounded bg-white/5 text-slate-400 hover:text-emerald-400" title="Other Link">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {!item.instagram && !item.linkedin && !item.web && !item.otherlink && <span className="text-[9px] text-slate-700 font-bold">-</span>}
                          </div>
                        </div>

                        {item.note && (
                          <div className="mt-1 bg-slate-950/40 p-2 rounded-lg border border-white/5">
                            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">Notes</span>
                            <p className="text-[9px] text-slate-300 leading-normal whitespace-pre-wrap">{item.note}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                        <div>
                          {(() => {
                            const proofUrls = getProofUrls(item.buktiurl);
                            if (proofUrls.length === 0) {
                              return <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">No Proof</span>;
                            }
                            if (proofUrls.length === 1) {
                              return (
                                <a href={ensureAbsoluteUrl(proofUrls[0])} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase tracking-wider hover:underline">
                                  <ExternalLink className="w-3 h-3" /> View Proof
                                </a>
                              );
                            }
                            return (
                              <div className="flex items-center gap-2 flex-wrap">
                                {proofUrls.map((url, idx) => (
                                  <a key={idx} href={ensureAbsoluteUrl(url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase tracking-wider hover:underline">
                                    <ExternalLink className="w-3 h-3" /> Proof #{idx + 1}
                                  </a>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button onClick={() => setSelectedJobForDetails(item)} className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider cursor-pointer">
                            <Eye className="w-3 h-3" /> Details
                          </button>
                          <button onClick={() => onEdit(item)} className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider cursor-pointer">
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => setRowToDelete(item.rownum)} className="text-slate-400 hover:text-rose-400 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider cursor-pointer">
                            <Trash2 className="w-3 h-3" /> Delete
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
          <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-3 bg-slate-950/80 border-t border-white/10 gap-3">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Showing <span className="text-indigo-400 font-bold">{indexOfFirstJob + 1}</span> to{' '}
              <span className="text-indigo-400 font-bold">{Math.min(indexOfLastJob, jobs.length)}</span> of{' '}
              <span className="text-white font-bold">{jobs.length}</span> applications
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
                    currentPage === page
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {rowToDelete !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-white font-bold text-xs leading-relaxed mb-5 px-2 uppercase tracking-wide">
              Hapus data ini? File di folder Drive juga akan terhapus.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setRowToDelete(null)}
                className="flex-1 bg-white/10 hover:bg-white/15 text-slate-300 font-bold py-2.5 rounded-xl transition text-[11px] uppercase tracking-wider cursor-pointer"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-xl transition text-[11px] uppercase tracking-wider shadow-lg shadow-rose-600/30 cursor-pointer"
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
