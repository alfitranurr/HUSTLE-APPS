/* cspell:disable */
'use client';

import React from 'react';
import { X, Calendar, Globe, FileText, ExternalLink, MapPin, Tag, Briefcase } from 'lucide-react';
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

const STAGES_LIST = [
  { name: 'Not Started', icon: '⏳' },
  { name: 'Document Screening', icon: '📄' },
  { name: 'Assessment Test', icon: '📝' },
  { name: 'HR Interview', icon: '👥' },
  { name: 'User Interview', icon: '🗣️' },
  { name: 'FGD/LGD', icon: '👥' },
  { name: 'Offering Letter', icon: '📩' },
  { name: 'Contract Signed / Done', icon: '✍️' },
];

const StageProgressStepper = ({ currentStage, status }: { currentStage?: string; status?: string }) => {
  const currentIdx = STAGES_LIST.findIndex(
    (s) => s.name.toLowerCase() === (currentStage || 'not started').toLowerCase()
  );
  const activeIndex = currentIdx === -1 ? 0 : currentIdx;
  const isFailed = (status || '').toLowerCase().includes('failed');

  return (
    <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-3 mb-5">
      <div className="flex justify-between items-center">
        <span className="text-[9.5px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          Application Stage Pipeline
        </span>
        <span className="text-[10px] font-bold text-slate-300 bg-slate-900 border border-white/10 px-2.5 py-0.5 rounded-full">
          Current: <span className="text-white font-black">{currentStage || 'Not Started'}</span>
        </span>
      </div>

      <div className="relative pt-2 pb-1">
        {/* Line Background */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-800/80 -z-0" />

        {/* Active Filled Line */}
        <div
          className={`absolute top-5 left-6 h-0.5 transition-all duration-500 -z-0 ${
            isFailed ? 'bg-rose-500 shadow-rose-500/50' : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/50'
          } shadow-sm`}
          style={{
            width: `${(activeIndex / (STAGES_LIST.length - 1)) * 88}%`,
          }}
        />

        {/* Stepper Nodes */}
        <div className="relative z-10 flex justify-between items-start">
          {STAGES_LIST.map((stg, idx) => {
            const isPassed = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            let circleStyle = 'bg-slate-900 border-slate-700 text-slate-500';
            if (isPassed) {
              circleStyle = 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30';
            } else if (isCurrent) {
              circleStyle = isFailed
                ? 'bg-rose-600 border-rose-400 text-white ring-4 ring-rose-500/20 shadow-lg shadow-rose-600/40 animate-pulse'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 border-white text-white ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-600/40';
            }

            return (
              <div key={stg.name} className="flex flex-col items-center flex-1 text-center group">
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black transition-all cursor-default ${circleStyle}`}
                  title={`${stg.name} ${isCurrent ? '(Current Stage)' : isPassed ? '(Completed)' : ''}`}
                >
                  {isPassed ? '✓' : isCurrent ? stg.icon : idx + 1}
                </div>

                <span
                  className={`text-[8px] mt-1.5 font-bold leading-tight px-0.5 transition ${
                    isCurrent
                      ? isFailed
                        ? 'text-rose-400 font-black'
                        : 'text-indigo-300 font-black'
                      : isPassed
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {stg.name.replace('Contract Signed / Done', 'Contract Signed')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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

  const locationString = job.province && job.city 
    ? `${job.city}, ${job.province}` 
    : job.city || job.province || 'Luar Daerah';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[90] animate-fade-in">
      <div className="glass w-full max-w-5xl rounded-[1.75rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-5 px-7 border-b border-white/10 flex justify-between items-center shrink-0 bg-slate-950/40">
          <div>
            <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest block mb-0.5">
              Application Details
            </span>
            <h2 className="text-xl font-black uppercase text-white leading-tight tracking-wider">
              {job.company}
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
              Position: {job.kategori || 'Unspecified'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0 ml-4 border border-white/5"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-7 flex-1 no-scrollbar overflow-hidden">
          {/* Horizontal Stage Progress Pipeline */}
          <StageProgressStepper currentStage={job.currentstage} status={job.status} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Core Attributes */}
            <div className="space-y-3">
              {/* Status & Stage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    App Status
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${getStatusClass(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Current Stage
                  </span>
                  <span className="bg-slate-900 border border-white/10 text-slate-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block">
                    {job.currentstage || 'Not Started'}
                  </span>
                </div>
              </div>

              {/* Location & Platform */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Location</span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mt-0.5 leading-snug">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      {locationString}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Platform</span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                      {job.platform || 'Other'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Date & Career Level */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Application Date</span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      {formatDateTime(job.startdate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Career Level</span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      {job.careerlevel || 'Not Specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scheduled Date & Time (Assessment / Interview) */}
              {(job.currentstage === 'Assessment Test' || job.currentstage === 'HR Interview' || job.currentstage === 'User Interview') && job.enddate && (
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-indigo-500/20 text-indigo-400">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                    {job.currentstage === 'Assessment Test' ? 'Assessment Test Schedule' : 'Interview Schedule'}
                  </span>
                  <span className="text-xs font-bold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    {formatDateTime(job.enddate)}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Links, Notes & Attachment */}
            <div className="space-y-3">
              {/* Reference Links */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Reference Links
                </span>
                <div className="flex gap-2.5 flex-wrap text-xs font-bold pt-0.5">
                  {job.instagram ? (
                    <a
                      href={ensureAbsoluteUrl(job.instagram)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:text-pink-300 transition"
                    >
                      <InstagramIcon className="w-4 h-4" /> Instagram
                    </a>
                  ) : null}
                  {job.linkedin ? (
                    <a
                      href={ensureAbsoluteUrl(job.linkedin)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 transition"
                    >
                      <LinkedinIcon className="w-4 h-4" /> LinkedIn
                    </a>
                  ) : null}
                  {job.web ? (
                    <a
                      href={ensureAbsoluteUrl(job.web)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <Globe className="w-4 h-4" /> Website
                    </a>
                  ) : null}
                  {job.otherlink ? (
                    <a
                      href={ensureAbsoluteUrl(job.otherlink)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition"
                    >
                      <ExternalLink className="w-4 h-4" /> Other Link
                    </a>
                  ) : null}
                  {!job.instagram && !job.linkedin && !job.web && !job.otherlink && (
                    <span className="text-slate-500 italic text-xs">No reference links attached.</span>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Application Notes
                </span>
                <div className="max-h-32 overflow-y-auto pr-1 no-scrollbar">
                  {job.note ? (
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {job.note}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No notes recorded for this application.
                    </p>
                  )}
                </div>
              </div>

              {/* Proof Attachment */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                      Proof File
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      {job.buktiurl && job.buktiurl !== 'No File' ? 'Attachment Uploaded' : 'No Attachment'}
                    </span>
                  </div>
                </div>
                {job.buktiurl && job.buktiurl !== 'No File' ? (
                  <a
                    href={ensureAbsoluteUrl(job.buktiurl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white transition shadow-md uppercase tracking-wider cursor-pointer"
                  >
                    Open File <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-7 border-t border-white/10 flex justify-end shrink-0 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl btn-gradient font-black text-white uppercase text-xs tracking-wider cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
