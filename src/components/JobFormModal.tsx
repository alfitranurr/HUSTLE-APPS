'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, Upload, FileText } from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from './BrandIcons';
import { Job } from '@/lib/googleSheets';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { useToast } from './Toast';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit: Job | null;
  onSuccess: () => void;
}

const formatToDatetimeLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return '';
  }
};

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  jobToEdit,
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Form Fields State
  const [company, setCompany] = useState('');
  const [kategori, setKategori] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [linkIg, setLinkIg] = useState('');
  const [linkLi, setLinkLi] = useState('');
  const [linkWeb, setLinkWeb] = useState('');
  const [note, setNote] = useState('');
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [existingUrl, setExistingUrl] = useState('');

  // Load edit data
  useEffect(() => {
    if (jobToEdit) {
      setCompany(jobToEdit.company || '');
      setKategori(jobToEdit.kategori || '');
      setStartDate(formatToDatetimeLocal(jobToEdit.startdate));
      setEndDate(formatToDatetimeLocal(jobToEdit.enddate));
      
      // Normalize Status
      let curStatus = jobToEdit.status;
      if (String(curStatus).toLowerCase() === 'done') curStatus = 'Success';
      if (String(curStatus).toLowerCase() === 'progress') curStatus = 'In Progress';
      setStatus(curStatus || 'Not Started');

      setLinkIg(jobToEdit.instagram || '');
      setLinkLi(jobToEdit.linkedin || '');
      setLinkWeb(jobToEdit.web || '');
      setNote(jobToEdit.note || '');
      setExistingUrl(jobToEdit.buktiurl || '');
      setBuktiFile(null);
    } else {
      // Reset Form for New Item
      setCompany('');
      setKategori('');
      setStartDate('');
      setEndDate('');
      setStatus('Not Started');
      setLinkIg('');
      setLinkLi('');
      setLinkWeb('');
      setNote('');
      setExistingUrl('');
      setBuktiFile(null);
    }
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  // Simple URL Validation
  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validations
    if (!company.trim()) {
      toast.error('Company name is required.');
      return;
    }

    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        toast.error('End Date cannot be earlier than Start Date.');
        return;
      }
    }

    const formattedIg = ensureAbsoluteUrl(linkIg);
    const formattedLi = ensureAbsoluteUrl(linkLi);
    const formattedWeb = ensureAbsoluteUrl(linkWeb);

    if (formattedIg && !isValidUrl(formattedIg)) {
      toast.error('Invalid Instagram Link URL format.');
      return;
    }
    if (formattedLi && !isValidUrl(formattedLi)) {
      toast.error('Invalid LinkedIn Link URL format.');
      return;
    }
    if (formattedWeb && !isValidUrl(formattedWeb)) {
      toast.error('Invalid Web Link URL format.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (jobToEdit) {
        formData.append('rowNum', String(jobToEdit.rownum));
        formData.append('id', jobToEdit.id || '');
      }
      formData.append('company', company);
      formData.append('kategori', kategori);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('status', status);
      formData.append('linkIg', formattedIg);
      formData.append('linkLi', formattedLi);
      formData.append('linkWeb', formattedWeb);
      formData.append('note', note);
      formData.append('existingUrl', existingUrl);

      if (buktiFile) {
        formData.append('buktiFile', buktiFile);
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(jobToEdit ? 'Entry updated successfully!' : 'Entry added successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to save application');
      }
    } catch (error) {
      console.error(error);
      toast.error('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass w-full max-w-lg rounded-[1.5rem] p-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-md font-black uppercase text-white tracking-wider">
            {jobToEdit ? 'Edit Entry' : 'New Application'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-2xl font-light transition"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Kategori</label>
              <input
                type="text"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                disabled={loading}
                placeholder="e.g. Frontend"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">End Date</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
            >
              <option value="Not Started">🟡 Not Started</option>
              <option value="In Progress">🔵 In Progress</option>
              <option value="Interview">🟣 Interview</option>
              <option value="Success">🟢 Success</option>
              <option value="Failed">🔴 Failed</option>
            </select>
          </div>

          {/* Social Links */}
          <div>
            <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Links</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="relative flex items-center">
                <InstagramIcon className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Instagram Link"
                  value={linkIg}
                  onChange={(e) => setLinkIg(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 pl-9 pr-3 text-[11px] text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="relative flex items-center">
                <LinkedinIcon className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="LinkedIn Link"
                  value={linkLi}
                  onChange={(e) => setLinkLi(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 pl-9 pr-3 text-[11px] text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="relative flex items-center">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Website Link"
                  value={linkWeb}
                  onChange={(e) => setLinkWeb(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 pl-9 pr-3 text-[11px] text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Notes</label>
            <textarea
              placeholder="Quick notes about interview status, tasks, salary, etc..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition h-20 resize-none"
            />
          </div>

          {/* Proof Attachment */}
          <div>
            <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1 text-indigo-400">
              Proof Attachment (Upload New)
            </label>
            <div className="relative border border-dashed border-[#334155] hover:border-indigo-500 transition rounded-xl p-4 flex flex-col items-center justify-center bg-[#0f172a]/50 cursor-pointer">
              <input
                type="file"
                disabled={loading}
                onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-5 h-5 text-slate-500 mb-2" />
              <span className="text-[10px] text-slate-400 font-semibold">
                {buktiFile ? buktiFile.name : 'Click to select or drag and drop proof file'}
              </span>
              <span className="text-[8px] text-slate-500 mt-1 uppercase">Images or PDF up to 5MB</span>
            </div>

            {existingUrl && existingUrl !== 'No File' && (
              <div className="flex items-center gap-1.5 mt-2 bg-indigo-500/10 border border-indigo-500/20 py-1.5 px-3 rounded-lg text-indigo-400">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Current file preserved</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient p-3.5 rounded-xl font-black text-white uppercase mt-2 text-xs tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              'Push Data'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
