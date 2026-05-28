'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Edit, Trash2, Globe, ExternalLink, AlertTriangle, Eye } from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from './BrandIcons';
import { Job } from '@/lib/googleSheets';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { useToast } from './Toast';
import { JobDetailsModal } from './JobDetailsModal';

interface JobTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDeleteSuccess: () => void;
}

export function getStatusClass(s?: string) {
  const st = String(s || '').toLowerCase();
  if (st.includes('not started')) return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
  if (st.includes('in progress') || st === 'progress') return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
  if (st.includes('success') || st === 'done') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (st.includes('failed')) return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
  } catch {
    return '---';
  }
};

export const JobTable: React.FC<JobTableProps> = ({ jobs, onEdit, onDeleteSuccess }) => {
  const toast = useToast();
  const [sortKey, setSortKey] = useState<'rownum' | 'company' | 'status' | 'startdate'>('startdate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

  const handleSort = (key: 'rownum' | 'company' | 'status' | 'startdate') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Perform sorting
  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortKey === 'rownum') {
      return sortAsc ? a.rownum - b.rownum : b.rownum - a.rownum;
    }
    if (sortKey === 'startdate') {
      const timeA = a.startdate ? new Date(a.startdate).getTime() : 0;
      const timeB = b.startdate ? new Date(b.startdate).getTime() : 0;
      return sortAsc ? timeA - timeB : timeB - timeA;
    }
    const valA = String(a[sortKey] || '').toLowerCase();
    const valB = String(b[sortKey] || '').toLowerCase();
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
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
      <div className="glass rounded-[2rem] overflow-hidden">
        {/* Table View (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-slate-500 uppercase text-[9px] font-black tracking-widest bg-slate-900/50">
              <tr className="border-b border-white/5">
                <th
                  onClick={() => handleSort('rownum')}
                  className="p-4 w-16 text-center cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    No. <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('company')}
                  className="p-4 cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center gap-1">
                    Entity <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-center w-24">Link</th>
                <th
                  onClick={() => handleSort('status')}
                  className="p-4 text-center w-32 cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('startdate')}
                  className="p-4 w-32 cursor-pointer hover:text-indigo-400 transition"
                >
                  <div className="flex items-center gap-1">
                    Timeline <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 max-w-[200px]">Notes</th>
                <th className="p-4 text-center w-20">Proof</th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
                    Zero applications found.
                  </td>
                </tr>
              ) : (
                sortedJobs.map((item, index) => {
                  const displayNo = sortAsc ? index + 1 : jobs.length - index;
                  return (
                    <tr key={item.id || item.rownum} className="hover:bg-white/5 border-b border-white/5 group transition duration-300">
                      <td className="p-4 text-center text-slate-500 font-bold text-[11px]">{displayNo}.</td>
                      <td className="p-4">
                        <div className="text-sm font-extrabold text-indigo-400 leading-tight">{item.company}</div>
                        <div className="text-[9px] text-slate-500 font-bold tracking-wider mb-1.5 capitalize">{item.kategori || '-'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {item.instagram ? (
                            <a href={ensureAbsoluteUrl(item.instagram)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-pink-500 transition">
                              <InstagramIcon className="w-4 h-4" />
                            </a>
                          ) : null}
                          {item.linkedin ? (
                            <a href={ensureAbsoluteUrl(item.linkedin)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-500 transition">
                              <LinkedinIcon className="w-4 h-4" />
                            </a>
                          ) : null}
                          {item.web ? (
                            <a href={ensureAbsoluteUrl(item.web)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 transition">
                              <Globe className="w-4 h-4" />
                            </a>
                          ) : null}
                          {!item.instagram && !item.linkedin && !item.web && <span className="text-[9px] text-slate-700 font-bold">-</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-[9px] font-bold flex flex-col gap-0.5 whitespace-nowrap">
                          <span>
                            <span className="text-indigo-400 uppercase text-[7px] font-black mr-1">S:</span>
                            {formatDate(item.startdate)}
                          </span>
                          <span>
                            <span className="text-red-400 uppercase text-[7px] font-black mr-1">E:</span>
                            {formatDate(item.enddate)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 cursor-pointer" onClick={() => setSelectedJobForDetails(item)}>
                        <div className="text-[10px] text-slate-400 max-w-[200px] truncate hover:text-slate-200 transition" title="Click to view details">
                          {item.note || '-'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {item.buktiurl && item.buktiurl !== 'No File' ? (
                          <a href={ensureAbsoluteUrl(item.buktiurl)} target="_blank" rel="noreferrer" className="inline-flex text-indigo-400 hover:text-white transition">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-[8px] text-slate-700 font-bold uppercase">N/A</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => setSelectedJobForDetails(item)} className="text-slate-500 hover:text-indigo-400 transition" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(item)} className="text-slate-500 hover:text-indigo-400 transition" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRowToDelete(item.rownum)} className="text-slate-500 hover:text-red-500 transition" title="Delete">
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
          {sortedJobs.length === 0 ? (
            <div className="p-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
              Zero applications found.
            </div>
          ) : (
            sortedJobs.map((item, index) => {
              const displayNo = sortAsc ? index + 1 : jobs.length - index;
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
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Timeline:</span>
                      <span className="text-[10px] font-mono">
                        S: {formatDate(item.startdate)} | E: {formatDate(item.enddate)}
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
                      <button onClick={() => setSelectedJobForDetails(item)} className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                      <button onClick={() => onEdit(item)} className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setRowToDelete(item.rownum)} className="text-slate-500 hover:text-red-500 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
