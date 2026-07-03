/* cspell:disable */
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Globe, Upload, FileText, Link as LinkIcon } from 'lucide-react';
import { InstagramIcon, LinkedinIcon, PlatformBrandIcon } from './BrandIcons';
import { Job } from '@/lib/googleSheets';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { useToast } from './Toast';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit: Job | null;
  onSuccess: () => void;
}

interface ProvinceData {
  id: string;
  nama: string;
}

interface RegencyData {
  id: string;
  province_id: string;
  nama: string;
}

// Fallback lists of provinces and cities if API fetch fails or offline
const STATIC_PROVINCES: { [key: string]: string[] } = {
  'Aceh': ['Kabupaten Simeulue', 'Kabupaten Aceh Singkil', 'Kabupaten Aceh Selatan', 'Kabupaten Aceh Tenggara', 'Kota Sabang', 'Kota Banda Aceh', 'Kota Lhokseumawe', 'Kota Langsa'],
  'Sumatera Utara': ['Kota Medan', 'Kota Binjai', 'Kota Tebing Tinggi'],
  'DKI Jakarta': ['Seluruh Provinsi (UMP)', 'Kota Jakarta Pusat', 'Kota Jakarta Selatan', 'Kota Jakarta Timur', 'Kota Jakarta Barat', 'Kota Jakarta Utara'],
  'Banten': ['Seluruh Provinsi (UMP)', 'Kota Tangerang', 'Kota Tangerang Selatan', 'Kabupaten Tangerang', 'Kota Cilegon', 'Kota Serang'],
  'Jawa Barat': ['Seluruh Provinsi (UMP)', 'Kota Bekasi', 'Kabupaten Bekasi', 'Kota Depok', 'Kota Bogor', 'Kota Bandung', 'Kota Cimahi', 'Kota Tasikmalaya'],
  'Jawa Tengah': ['Seluruh Provinsi (UMP)', 'Kota Semarang', 'Kota Surakarta (Solo)', 'Kabupaten Kudus'],
  'DI Yogyakarta': ['Seluruh Provinsi (UMP)', 'Kota Yogyakarta', 'Kabupaten Sleman'],
  'Jawa Timur': ['Seluruh Provinsi (UMP)', 'Kota Surabaya', 'Kabupaten Gresik', 'Kabupaten Sidoarjo', 'Kota Malang'],
  'Bali': ['Seluruh Provinsi (UMP)', 'Kota Denpasar', 'Kabupaten Badung'],
  'Riau': ['Seluruh Provinsi (UMP)', 'Kota Pekanbaru'],
  'Kepulauan Riau': ['Seluruh Provinsi (UMP)', 'Kota Batam'],
  'Sulawesi Selatan': ['Seluruh Provinsi (UMP)', 'Kota Makassar'],
  'Kalimantan Timur': ['Seluruh Provinsi (UMP)', 'Kota Balikpapan', 'Kota Samarinda']
};

const PLATFORMS = [
  'LinkedIn',
  'Instagram',
  'Direct Web',
  'G-Form / Microsoft Form',
  'JobStreet',
  'Glints',
  '9CV9',
  'Kalibrr',
  'Tech In Asia',
  'Indeed',
  'Telegram',
  'Other'
];

const CAREER_LEVELS = ['Internship', 'Entry Level / Junior', 'Associate / Mid-Senior', 'Senior', 'Lead / Manager', 'Director / Executive', 'Not Specified'];
const levelIcons: Record<string, string> = {
  'Internship': '🌱',
  'Entry Level / Junior': '🚀',
  'Associate / Mid-Senior': '⚡',
  'Senior': '⭐',
  'Lead / Manager': '👑',
  'Director / Executive': '🏆',
  'Not Specified': '❓',
};

const STAGES = ['Not Started', 'Document Screening', 'Assessment Test', 'HR Interview', 'User Interview', 'FGD/LGD', 'Offering Letter', 'Contract Signed / Done'];

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

// Generic Custom Select component for consistent styling and font size across all dropdowns
const CustomGenericSelect = ({
  label,
  value,
  onChange,
  options,
  disabled,
  dropUp,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode | string }[];
  disabled?: boolean;
  dropUp?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-[8.5px] font-bold text-slate-400 ml-1 uppercase tracking-wider block mb-1">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 transition flex items-center justify-between cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOpt?.icon && <span className="shrink-0">{selectedOpt.icon}</span>}
          <span className="font-semibold text-slate-200 truncate">{value || 'Select...'}</span>
        </span>
        <span className="text-slate-500 text-[10px] ml-1 shrink-0">▼</span>
      </button>

      {isOpen && !disabled && (
        <ul className={`absolute z-50 w-full ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} max-h-40 overflow-y-auto bg-[#0f172a] border border-[#334155] rounded-xl shadow-2xl py-1 divide-y divide-white/[0.03] no-scrollbar`}>
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3.5 py-2 text-xs text-slate-200 hover:bg-indigo-600 hover:text-white cursor-pointer transition flex items-center gap-2.5 ${
                opt.value === value ? 'bg-indigo-600/30 font-bold text-white' : ''
              }`}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Reusable Searchable ComboBox Component
const SearchableSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  dropUp,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  dropUp?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setSearch(value);
  }

  // Click outside listener to handle focus states and custom text inputs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const trimmed = search.trim();
        // Match case-insensitively with options
        const matched = options.find(opt => opt.toLowerCase() === trimmed.toLowerCase());
        if (matched) {
          onChange(matched);
          setSearch(matched);
        } else if (trimmed !== '') {
          onChange(trimmed); // Allow custom search terms
        } else {
          setSearch(value);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [search, value, options, onChange]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(opt =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-[9px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch(''); // clear search on focus so user can filter easily
          }}
          disabled={disabled}
          placeholder={placeholder || "Type or search..."}
          className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-2.5 pr-8 text-xs text-white outline-none focus:border-indigo-500 transition"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
          ▼
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className={`absolute z-50 w-full ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} max-h-48 overflow-y-auto bg-[#0f172a] border border-[#334155] rounded-xl shadow-2xl py-1 divide-y divide-white/[0.03] no-scrollbar`}>
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500 italic">No matches. Press click-away to save custom text.</li>
          ) : (
            filteredOptions.map((opt) => (
              <li
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setSearch(opt);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition ${
                  opt.toLowerCase() === value.toLowerCase() ? 'bg-indigo-600/30 text-white font-bold' : ''
                }`}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  jobToEdit,
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Provinces & Cities API States
  const [provincesList, setProvincesList] = useState<ProvinceData[]>([]);
  const [citiesList, setCitiesList] = useState<RegencyData[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

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
  const [startDate, setStartDate] = useState(''); // Used for Application Date
  const [status, setStatus] = useState('Not Started'); // Used for App Status
  const [linkIg, setLinkIg] = useState('');
  const [linkLi, setLinkLi] = useState('');
  const [linkWeb, setLinkWeb] = useState('');
  const [linkOther, setLinkOther] = useState('');
  const [note, setNote] = useState('');
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [existingUrl, setExistingUrl] = useState('');

  // New Fields States
  const [platform, setPlatform] = useState('LinkedIn');
  const [careerLevel, setCareerLevel] = useState('Not Specified');
  const [currentStage, setCurrentStage] = useState('Not Started');
  const [province, setProvince] = useState('Daerah Khusus Ibukota Jakarta');
  const [city, setCity] = useState('Seluruh Provinsi (UMP)');

  useEffect(() => {
    if (isOpen && provincesList.length === 0) {
      Promise.resolve().then(() => setLoadingRegions(true));
      fetch('https://ibnux.github.io/data-indonesia/provinsi.json')
        .then((res) => {
          if (!res.ok) throw new Error('API failed');
          return res.json();
        })
        .then((data) => {
          const sorted = (data as ProvinceData[]).sort((a, b) => a.nama.localeCompare(b.nama));
          // Append "Lainnya / Luar Negeri" to the end
          setProvincesList([...sorted, { id: '99', nama: 'Lainnya / Luar Negeri' }]);
          setLoadingRegions(false);
        })
        .catch((err) => {
          console.warn('Failed to load online provinces list. Falling back to static values.', err);
          const fallbackProvs = Object.keys(STATIC_PROVINCES).map((name, idx) => ({
            id: String(idx + 100), // fallback fake ids
            nama: name
          }));
          setProvincesList([...fallbackProvs, { id: '99', nama: 'Lainnya / Luar Negeri' }]);
          setLoadingRegions(false);
        });
    }
  }, [isOpen, provincesList]);

  // 2. Fetch Cities list dynamically when selected province changes
  useEffect(() => {
    if (!province || provincesList.length === 0) return;

    const matchedProvince = provincesList.find(
      (p) => p.nama.toLowerCase() === province.toLowerCase()
    );

    if (matchedProvince) {
      Promise.resolve().then(() => {
        setLoadingRegions(true);
        
        // If "Lainnya / Luar Negeri" is chosen
        if (matchedProvince.id === '99') {
          setCitiesList([
            { id: '9901', province_id: '99', nama: 'Luar Negeri' },
            { id: '9902', province_id: '99', nama: 'Daerah Lain' }
          ]);
          setLoadingRegions(false);
        }
        // If using fallback fake IDs (100+)
        else if (Number(matchedProvince.id) >= 100) {
          const staticCities = STATIC_PROVINCES[matchedProvince.nama] || ['Seluruh Provinsi (UMP)'];
          setCitiesList(staticCities.map((cName, idx) => ({
            id: String(idx + 1000),
            province_id: matchedProvince.id,
            nama: cName
          })));
          setLoadingRegions(false);
        } else {
          fetch(`https://ibnux.github.io/data-indonesia/kabupaten/${matchedProvince.id}.json`)
            .then((res) => {
              if (!res.ok) throw new Error('API failed');
              return res.json();
            })
            .then((data) => {
              const sorted = (data as RegencyData[]).sort((a, b) => a.nama.localeCompare(b.nama));
              setCitiesList(sorted);
              setLoadingRegions(false);
            })
            .catch((err) => {
              console.warn('Failed to load online cities. Falling back.', err);
              const staticCities = STATIC_PROVINCES[matchedProvince.nama] || ['Seluruh Provinsi (UMP)'];
              setCitiesList(staticCities.map((cName, idx) => ({
                id: String(idx + 1000),
                province_id: matchedProvince.id,
                nama: cName
              })));
              setLoadingRegions(false);
            });
        }
      });
    }
  }, [province, provincesList]);

  useEffect(() => {
    if (citiesList.length > 0) {
      const cityNames = citiesList.map(c => c.nama);
      // If selected city is not in the loaded list, auto-select the first one
      if (!cityNames.some(cName => cName.toLowerCase() === city.toLowerCase())) {
        Promise.resolve().then(() => setCity(cityNames[0]));
      }
    }
  }, [citiesList, city]);

  // Load edit data
  useEffect(() => {
    Promise.resolve().then(() => {
      if (jobToEdit) {
        setCompany(jobToEdit.company || '');
        setKategori(jobToEdit.kategori || '');
        setStartDate(formatToDatetimeLocal(jobToEdit.startdate));
        
        // Normalize Status
        let curStatus = jobToEdit.status;
        if (String(curStatus).toLowerCase() === 'done') curStatus = 'Success';
        if (String(curStatus).toLowerCase() === 'progress') curStatus = 'In Progress';
        setStatus(curStatus || 'Not Started');

        setLinkIg(jobToEdit.instagram || '');
        setLinkLi(jobToEdit.linkedin || '');
        setLinkWeb(jobToEdit.web || '');
        setLinkOther(jobToEdit.otherlink || '');
        setNote(jobToEdit.note || '');
        setExistingUrl(jobToEdit.buktiurl || '');
        setBuktiFile(null);

        // Load new fields
        setPlatform(jobToEdit.platform || 'LinkedIn');
        setCareerLevel(jobToEdit.careerlevel || 'Not Specified');
        setCurrentStage(jobToEdit.currentstage || 'Not Started');
        setProvince(jobToEdit.province || 'Daerah Khusus Ibukota Jakarta');
        setCity(jobToEdit.city || 'Seluruh Provinsi (UMP)');
      } else {
        // Reset Form for New Item
        setCompany('');
        setKategori('');
        setStartDate('');
        setStatus('Not Started');
        setLinkIg('');
        setLinkLi('');
        setLinkWeb('');
        setLinkOther('');
        setNote('');
        setExistingUrl('');
        setBuktiFile(null);

        setPlatform('LinkedIn');
        setCareerLevel('Not Specified');
        setCurrentStage('Not Started');
        setProvince('Daerah Khusus Ibukota Jakarta');
        setCity('Seluruh Provinsi (UMP)');
      }
    });
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

    // Validations
    if (!company.trim()) {
      toast.error('Company name is required.');
      return;
    }
    if (!startDate) {
      toast.error('Application Date is required.');
      return;
    }
    if (!platform) {
      toast.error('Platform is required.');
      return;
    }
    if (!status) {
      toast.error('App Status is required.');
      return;
    }
    if (!currentStage) {
      toast.error('Current Stage is required.');
      return;
    }

    const formattedIg = ensureAbsoluteUrl(linkIg);
    const formattedLi = ensureAbsoluteUrl(linkLi);
    const formattedWeb = ensureAbsoluteUrl(linkWeb);
    const formattedOther = ensureAbsoluteUrl(linkOther);

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
    if (formattedOther && !isValidUrl(formattedOther)) {
      toast.error('Invalid Other Link URL format.');
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
      formData.append('startDate', startDate); // Used for Application Date
      formData.append('endDate', ''); 
      formData.append('status', status);
      formData.append('linkIg', formattedIg);
      formData.append('linkLi', formattedLi);
      formData.append('linkWeb', formattedWeb);
      formData.append('linkOther', formattedOther);
      formData.append('note', note);
      formData.append('existingUrl', existingUrl);

      // New Fields
      formData.append('platform', platform);
      formData.append('careerLevel', careerLevel);
      formData.append('currentStage', currentStage);
      formData.append('province', province);
      formData.append('city', city);

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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in">
      <div className="glass w-full max-w-5xl rounded-[1.75rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-5 px-7 border-b border-white/10 flex justify-between items-center shrink-0 bg-slate-950/40">
          <div>
            <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest block mb-0.5">
              {jobToEdit ? 'Edit Form' : 'New Entry'}
            </span>
            <h2 className="text-xl font-black uppercase text-white tracking-wider">
              {jobToEdit ? 'Edit Application Details' : 'New Application Entry'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0 border border-white/5"
            disabled={loading}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - 2 Column Grid */}
        <form id="job-form" onSubmit={handleSubmit} className="p-6 md:p-7 flex-1 no-scrollbar overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Primary Details */}
            <div className="space-y-3">
              {/* Company & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-wider block mb-1">Company *</label>
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
                  <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-wider block mb-1">Kategori (Position)</label>
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

              {/* Platform & Career Level */}
              <div className="grid grid-cols-2 gap-3">
                <CustomGenericSelect
                  label="Platform *"
                  value={platform}
                  onChange={setPlatform}
                  disabled={loading}
                  options={PLATFORMS.map((plat) => ({
                    value: plat,
                    label: plat,
                    icon: <PlatformBrandIcon platform={plat} />,
                  }))}
                />
                <CustomGenericSelect
                  label="Career Level"
                  value={careerLevel}
                  onChange={setCareerLevel}
                  disabled={loading}
                  options={CAREER_LEVELS.map((lvl) => ({
                    value: lvl,
                    label: lvl,
                    icon: levelIcons[lvl] || '🏷️',
                  }))}
                />
              </div>

              {/* App Status & Current Stage */}
              <div className="grid grid-cols-2 gap-3">
                <CustomGenericSelect
                  label="App Status *"
                  value={status}
                  onChange={setStatus}
                  disabled={loading}
                  options={[
                    { value: 'Not Started', label: 'Not Started', icon: '🟡' },
                    { value: 'In Progress', label: 'In Progress', icon: '🔵' },
                    { value: 'Success', label: 'Success', icon: '🟢' },
                    { value: 'Failed', label: 'Failed', icon: '🔴' },
                  ]}
                />
                <CustomGenericSelect
                  label="Current Stage *"
                  value={currentStage}
                  onChange={setCurrentStage}
                  disabled={loading}
                  options={STAGES.map((stg) => {
                    const stageIcons: Record<string, string> = {
                      'Not Started': '⏳',
                      'Document Screening': '📄',
                      'Assessment Test': '📝',
                      'HR Interview': '👥',
                      'User Interview': '🗣️',
                      'FGD/LGD': '👥',
                      'Offering Letter': '📩',
                      'Contract Signed / Done': '✍️',
                    };
                    return {
                      value: stg,
                      label: stg,
                      icon: stageIcons[stg] || '📌',
                    };
                  })}
                />
              </div>

              {/* Application Date */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-wider block mb-1">Application Date *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Searchable Province & City inputs */}
              <div className="grid grid-cols-2 gap-3">
                <SearchableSelect
                  label={`Location (Province) ${loadingRegions ? '⏳' : ''}`}
                  value={province}
                  onChange={setProvince}
                  options={provincesList.map(p => p.nama)}
                  disabled={loading || loadingRegions}
                  dropUp={true}
                  placeholder={loadingRegions ? "Loading..." : "Search Province..."}
                />
                <SearchableSelect
                  label="Location (City)"
                  value={city}
                  onChange={setCity}
                  options={citiesList.map(c => c.nama)}
                  disabled={loading || loadingRegions}
                  dropUp={true}
                  placeholder={loadingRegions ? "Loading..." : "Search City..."}
                />
              </div>
            </div>

            {/* Right Column: Links, Notes & Attachment */}
            <div className="space-y-3">
              {/* Social Links */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-wider block mb-1">Links</label>
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <InstagramIcon className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Instagram Link"
                      value={linkIg}
                      onChange={(e) => setLinkIg(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500 transition"
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
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500 transition"
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
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Other Link"
                      value={linkOther}
                      onChange={(e) => setLinkOther(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-wider block mb-1">Notes</label>
                <textarea
                  placeholder="Quick notes about interview status, tasks, salary, etc..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition h-20 resize-none leading-relaxed"
                />
              </div>

              {/* Proof Attachment */}
              <div>
                <label className="text-[9px] font-bold text-indigo-400 ml-1 uppercase tracking-wider block mb-1">
                  Proof Attachment (Upload New)
                </label>
                <div className="relative border border-dashed border-[#334155] hover:border-indigo-500 transition rounded-xl p-3.5 flex flex-col items-center justify-center bg-[#0f172a]/50 cursor-pointer">
                  <input
                    type="file"
                    disabled={loading}
                    onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-4 h-4 text-slate-500 mb-1" />
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {buktiFile ? buktiFile.name : 'Click to select or drag proof file'}
                  </span>
                  <span className="text-[8px] text-slate-500 mt-0.5 uppercase">Images or PDF up to 5MB</span>
                </div>

                {existingUrl && existingUrl !== 'No File' && (
                  <div className="flex items-center gap-1.5 mt-1.5 bg-indigo-500/10 border border-indigo-500/20 py-1 px-2.5 rounded-lg text-indigo-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Current file preserved</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 px-7 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="job-form"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl btn-gradient font-black text-white uppercase text-xs tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              'Push Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
