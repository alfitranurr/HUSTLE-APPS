'use client';

import React from 'react';
import { X, Calendar, Globe, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { Job } from '@/lib/googleSheets';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { getStatusClass } from './JobTable';
import { InstagramIcon, LinkedinIcon } from './BrandIcons';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '---';
  }
};

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ isOpen, onClose, job }) => {
  React.useEffect(() => {
    if (isOpen && job) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[90] animate-fade-in">
      <div className="glass w-full max-w-lg rounded-[1.5rem] p-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/5">
          <div>
            <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest block mb-1">
              Application details
            </span>
            <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tight">
              {job.company}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
              Category: {job.kategori || 'Uncategorized'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {/* Status & Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Current Status
              </span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusClass(job.status)}`}>
                {job.status}
              </span>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Record Row Number
              </span>
              <span className="text-xs font-black text-slate-300">
                Row #{job.rownum}
              </span>
            </div>
          </div>

          {/* Timeline Dates */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
              Timeline Details
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] font-black text-indigo-400 block uppercase">Start Date & Time</span>
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {formatDateTime(job.startdate)}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black text-red-400 block uppercase">End Date & Time</span>
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {formatDateTime(job.enddate)}
                </span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
              Reference Links
            </span>
            <div className="flex gap-4 flex-wrap text-xs font-semibold">
              {job.instagram ? (
                <a
                  href={ensureAbsoluteUrl(job.instagram)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition"
                >
                  <InstagramIcon className="w-4 h-4" /> Instagram
                </a>
              ) : null}
              {job.linkedin ? (
                <a
                  href={ensureAbsoluteUrl(job.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition"
                >
                  <LinkedinIcon className="w-4 h-4" /> LinkedIn
                </a>
              ) : null}
              {job.web ? (
                <a
                  href={ensureAbsoluteUrl(job.web)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition"
                >
                  <Globe className="w-4 h-4" /> Website
                </a>
              ) : null}
              {!job.instagram && !job.linkedin && !job.web && (
                <span className="text-slate-600 italic">No reference links attached.</span>
              )}
            </div>
          </div>

          {/* Notes Section (Fully visible & formatting-preserved) */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Application Notes
            </span>
            <div className="max-h-48 overflow-y-auto pr-1">
              {job.note ? (
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {job.note}
                </p>
              ) : (
                <p className="text-xs text-slate-600 italic font-bold">
                  No notes recorded.
                </p>
              )}
            </div>
          </div>

          {/* Attachment Info */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                  Proof File
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {job.buktiurl && job.buktiurl !== 'No File' ? 'Attachment Uploaded' : 'No Attachment'}
                </span>
              </div>
            </div>
            {job.buktiurl && job.buktiurl !== 'No File' ? (
              <a
                href={ensureAbsoluteUrl(job.buktiurl)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-white transition uppercase tracking-wider"
              >
                Open File <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
