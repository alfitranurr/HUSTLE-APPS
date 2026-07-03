'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Coins, 
  Search, 
  ChevronDown, 
  X, 
  Calculator, 
  CheckCircle2, 
  XCircle, 
  Info,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

interface RegionData {
  name: string;
  province: string;
  type: 'UMP' | 'UMK';
  wage2026: number;
  wage2025: number;
}

const REGIONAL_WAGES: RegionData[] = [
  // DKI Jakarta
  { name: 'DKI Jakarta (UMP)', province: 'DKI Jakarta', type: 'UMP', wage2026: 5729876, wage2025: 5396760 },
  
  // Banten
  { name: 'Banten (UMP)', province: 'Banten', type: 'UMP', wage2026: 3084365, wage2025: 2905119 },
  { name: 'Kota Tangerang', province: 'Banten', type: 'UMK', wage2026: 5376677, wage2025: 5064215 },
  { name: 'Kota Tangerang Selatan', province: 'Banten', type: 'UMK', wage2026: 5266372, wage2025: 4960320 },
  { name: 'Kabupaten Tangerang', province: 'Banten', type: 'UMK', wage2026: 5287393, wage2025: 4980120 },
  
  // Jawa Barat
  { name: 'Jawa Barat (UMP)', province: 'Jawa Barat', type: 'UMP', wage2026: 2326431, wage2025: 2191232 },
  { name: 'Kota Bekasi', province: 'Jawa Barat', type: 'UMK', wage2026: 6041871, wage2025: 5690752 },
  { name: 'Kabupaten Bekasi', province: 'Jawa Barat', type: 'UMK', wage2026: 5911769, wage2025: 5568210 },
  { name: 'Kota Depok', province: 'Jawa Barat', type: 'UMK', wage2026: 5754745, wage2025: 5420312 },
  { name: 'Kota Bogor', province: 'Jawa Barat', type: 'UMK', wage2026: 5436382, wage2025: 5120450 },
  { name: 'Kota Bandung', province: 'Jawa Barat', type: 'UMK', wage2026: 4751330, wage2025: 4475210 },
  { name: 'Kota Cimahi', province: 'Jawa Barat', type: 'UMK', wage2026: 4098385, wage2025: 3860210 },
  { name: 'Kota Tasikmalaya', province: 'Jawa Barat', type: 'UMK', wage2026: 3174727, wage2025: 2990230 },
  
  // Jawa Tengah
  { name: 'Jawa Tengah (UMP)', province: 'Jawa Tengah', type: 'UMP', wage2026: 2303197, wage2025: 2169348 },
  { name: 'Kota Semarang', province: 'Jawa Tengah', type: 'UMK', wage2026: 3673747, wage2025: 3460250 },
  { name: 'Kota Surakarta (Solo)', province: 'Jawa Tengah', type: 'UMK', wage2026: 2564324, wage2025: 2415300 },
  { name: 'Kabupaten Kudus', province: 'Jawa Tengah', type: 'UMK', wage2026: 2850877, wage2025: 2685200 },
  
  // DI Yogyakarta
  { name: 'DI Yogyakarta (UMP)', province: 'DI Yogyakarta', type: 'UMP', wage2026: 2403774, wage2025: 2264080 },
  { name: 'Kota Yogyakarta', province: 'DI Yogyakarta', type: 'UMK', wage2026: 2819238, wage2025: 2655400 },
  { name: 'Kabupaten Sleman', province: 'DI Yogyakarta', type: 'UMK', wage2026: 2618365, wage2025: 2466200 },
  
  // Jawa Timur
  { name: 'Jawa Timur (UMP)', province: 'Jawa Timur', type: 'UMP', wage2026: 2448263, wage2025: 2305984 },
  { name: 'Kota Surabaya', province: 'Jawa Timur', type: 'UMK', wage2026: 5344810, wage2025: 5034200 },
  { name: 'Kabupaten Gresik', province: 'Jawa Timur', type: 'UMK', wage2026: 5329840, wage2025: 5020100 },
  { name: 'Kabupaten Sidoarjo', province: 'Jawa Timur', type: 'UMK', wage2026: 5327929, wage2025: 5018300 },
  { name: 'Kota Malang', province: 'Jawa Timur', type: 'UMK', wage2026: 3732007, wage2025: 3515100 },
  
  // Bali
  { name: 'Bali (UMP)', province: 'Bali', type: 'UMP', wage2026: 3181448, wage2025: 2996560 },
  { name: 'Kota Denpasar', province: 'Bali', type: 'UMK', wage2026: 3504884, wage2025: 3301200 },
  { name: 'Kabupaten Badung', province: 'Bali', type: 'UMK', wage2026: 5186532, wage2025: 4885120 },
  
  // Riau & Kepri
  { name: 'Riau (UMP)', province: 'Riau', type: 'UMP', wage2026: 3725266, wage2025: 3508775 },
  { name: 'Kota Pekanbaru', province: 'Riau', type: 'UMK', wage2026: 3907183, wage2025: 3680120 },
  { name: 'Kepulauan Riau (UMP)', province: 'Kepulauan Riau', type: 'UMP', wage2026: 3847232, wage2025: 3623653 },
  { name: 'Kota Batam', province: 'Kepulauan Riau', type: 'UMK', wage2026: 5321559, wage2025: 5012300 },
  
  // Sumatera Utara
  { name: 'Sumatera Utara (UMP)', province: 'Sumatera Utara', type: 'UMP', wage2026: 3177242, wage2025: 2992599 },
  { name: 'Kota Medan', province: 'Sumatera Utara', type: 'UMK', wage2026: 4268193, wage2025: 4020150 },
  
  // Sulawesi Selatan
  { name: 'Sulawesi Selatan (UMP)', province: 'Sulawesi Selatan', type: 'UMP', wage2026: 3883196, wage2025: 3657527 },
  { name: 'Kota Makassar', province: 'Sulawesi Selatan', type: 'UMK', wage2026: 4119608, wage2025: 3880200 },
  
  // Kalimantan Timur
  { name: 'Kalimantan Timur (UMP)', province: 'Kalimantan Timur', type: 'UMP', wage2026: 3806322, wage2025: 3585120 },
  { name: 'Kota Balikpapan', province: 'Kalimantan Timur', type: 'UMK', wage2026: 4055800, wage2025: 3820100 },
  { name: 'Kota Samarinda', province: 'Kalimantan Timur', type: 'UMK', wage2026: 4013438, wage2025: 3780200 }
];

const formatIDR = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

export default function UmrPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('');
  
  // Calculator States
  const [inputSalary, setInputSalary] = useState<number>(5000000);
  const [calcProvince, setCalcProvince] = useState('DKI Jakarta');
  const [calcRegionName, setCalcRegionName] = useState('DKI Jakarta (UMP)');

  useEffect(() => {
    setMounted(true);
  }, []);

  const provinces = useMemo(() => {
    return Array.from(new Set(REGIONAL_WAGES.map(item => item.province))).sort();
  }, []);

  // Filter calculator regions based on chosen province
  const calcRegionsList = useMemo(() => {
    return REGIONAL_WAGES.filter(item => item.province === calcProvince);
  }, [calcProvince]);

  // Sync selected region when province changes
  useEffect(() => {
    if (calcRegionsList.length > 0) {
      const defaultRegion = calcRegionsList.find(r => r.type === 'UMP') || calcRegionsList[0];
      setCalcRegionName(defaultRegion.name);
    }
  }, [calcProvince, calcRegionsList]);

  // Selected region data for calculation
  const selectedRegionData = useMemo(() => {
    return REGIONAL_WAGES.find(r => r.name === calcRegionName) || REGIONAL_WAGES[0];
  }, [calcRegionName]);

  // Calculations
  const calcResults = useMemo(() => {
    const wage = selectedRegionData.wage2026;
    const diff = inputSalary - wage;
    const pct = (diff / wage) * 100;
    const isAbove = diff >= 0;

    return {
      wage,
      diff: Math.abs(diff),
      pct: Math.abs(pct).toFixed(1),
      isAbove
    };
  }, [inputSalary, selectedRegionData]);

  // Filtered Wages directory
  const filteredWages = useMemo(() => {
    return REGIONAL_WAGES.filter((item) => {
      if (selectedProvinceFilter && item.province !== selectedProvinceFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.province.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [searchQuery, selectedProvinceFilter]);

  // Prepare chart data comparing selected region, user salary, Jakarta UMP (Benchmark) and Highest Bekasi (Max Ceiling)
  const chartData = useMemo(() => {
    return [
      {
        name: 'Benchmark (DKI Jakarta UMP)',
        nominal: 5729876,
        fill: '#818cf8' // Indigo-400
      },
      {
        name: `Selected UMR (${selectedRegionData.name})`,
        nominal: selectedRegionData.wage2026,
        fill: '#c084fc' // Purple-400
      },
      {
        name: 'Gaji Anda',
        nominal: inputSalary,
        fill: calcResults.isAbove ? '#34d399' : '#f87171' // Emerald-400 or Red-400
      },
      {
        name: 'UMR Tertinggi (Kota Bekasi)',
        nominal: 6041871,
        fill: '#facc15' // Yellow-400
      }
    ];
  }, [selectedRegionData, inputSalary, calcResults]);

  if (!mounted) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full flex-grow space-y-8 animate-pulse">
        <div className="h-20 bg-slate-900 rounded-3xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-900 rounded-3xl" />
          <div className="h-96 bg-slate-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-grow space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/10">
              Ketenagakerjaan
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              / UMR Daerah
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase italic">
            Daftar UMR Indonesia
            <span className="bg-indigo-500/15 text-indigo-400 text-[9px] not-italic font-black tracking-widest px-2 py-0.5 rounded-md border border-indigo-500/20">
              2026 DATA
            </span>
          </h2>
          <p className="text-slate-500 text-[11px] font-medium mt-1">
            Pengecekan Upah Minimum Provinsi (UMP) dan Upah Minimum Kabupaten/Kota (UMK) real-time seluruh Indonesia.
          </p>
        </div>
      </div>

      {/* Split Layout: Calculator & Charts vs Wages Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Calculator & Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Interactive Calculator */}
          <div className="glass rounded-[2rem] p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest">
                Kalkulator Kelayakan Gaji
              </h3>
            </div>

            <div className="space-y-4">
              {/* Input: Salary */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                  Gaji Bulanan Anda (Rupiah)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-slate-500 font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={inputSalary}
                    onChange={(e) => setInputSalary(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition font-bold"
                  />
                </div>
              </div>

              {/* Selection: Province */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    Provinsi
                  </label>
                  <div className="relative">
                    <select
                      value={calcProvince}
                      onChange={(e) => setCalcProvince(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-3 pr-8 text-xs focus:outline-none focus:border-indigo-500/50 transition cursor-pointer appearance-none text-slate-300 font-medium"
                    >
                      {provinces.map((prov) => (
                        <option key={prov} value={prov} className="bg-[#0f172a] text-white">
                          {prov}
                        </option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Selection: Region Name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    Wilayah UMP/UMK
                  </label>
                  <div className="relative">
                    <select
                      value={calcRegionName}
                      onChange={(e) => setCalcRegionName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-3 pr-8 text-xs focus:outline-none focus:border-indigo-500/50 transition cursor-pointer appearance-none text-slate-300 font-medium"
                    >
                      {calcRegionsList.map((region) => (
                        <option key={region.name} value={region.name} className="bg-[#0f172a] text-white">
                          {region.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Alert Cards */}
            <div className="pt-2">
              {calcResults.isAbove ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-black text-white leading-tight uppercase tracking-wider">
                        Layak - Di Atas UMR
                      </h4>
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                        +{calcResults.pct}% di atas UMR Daerah ({formatIDR(calcResults.wage)})
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pl-7">
                    Gaji Anda selisih <span className="text-white font-extrabold">{formatIDR(calcResults.diff)}</span> lebih tinggi dari batas minimum regional wilayah terpilih.
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-black text-white leading-tight uppercase tracking-wider">
                        Di Bawah UMR
                      </h4>
                      <p className="text-[10px] text-red-400 font-bold mt-0.5">
                        -{calcResults.pct}% di bawah UMR Daerah ({formatIDR(calcResults.wage)})
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pl-7">
                    Gaji Anda kurang <span className="text-white font-extrabold">{formatIDR(calcResults.diff)}</span> dari batas upah minimum regional resmi.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Visual Chart */}
          <div className="glass rounded-[2rem] p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Komparasi Visual Upah
              </h3>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                Rupiah Nominal
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 8 }} 
                    axisLine={false} 
                    tickLine={false}
                    interval={0}
                    tickFormatter={(val) => {
                      if (val.includes('Benchmark')) return 'Jakarta';
                      if (val.includes('Selected')) return 'Daerah Ini';
                      if (val.includes('Gaji')) return 'Gaji Anda';
                      return 'Bekasi (Max)';
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 8 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 shadow-2xl backdrop-blur-md">
                            <p className="text-[9px] text-slate-500 uppercase mb-0.5">{payload[0].name}</p>
                            <p className="text-white font-extrabold">{formatIDR(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="nominal" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-2">
              <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                <div className="w-2.5 h-2.5 rounded bg-[#818cf8]" /> Jakarta UMP
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                <div className="w-2.5 h-2.5 rounded bg-[#c084fc]" /> UMR Pilihan
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                <div className="w-2.5 h-2.5 rounded bg-emerald-400" /> Gaji Anda
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                <div className="w-2.5 h-2.5 rounded bg-[#facc15]" /> UMR Tertinggi
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Wages Directory (7 cols) */}
        <div className="lg:col-span-7 glass rounded-[2rem] overflow-hidden flex flex-col h-[41rem]">
          {/* Header & filters */}
          <div className="p-6 border-b border-white/5 space-y-4">
            <h3 className="font-extrabold text-white uppercase text-[10px] tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Direktori Upah Minimum Regional (2025 - 2026)
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari Kota, Kabupaten, atau Provinsi..."
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

              {/* Province filter */}
              <div className="relative sm:w-48 shrink-0">
                <select
                  value={selectedProvinceFilter}
                  onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 pl-3 pr-8 text-xs focus:outline-none focus:border-indigo-500/50 transition cursor-pointer appearance-none text-slate-300"
                >
                  <option value="" className="bg-[#0f172a] text-slate-400">Semua Provinsi</option>
                  {provinces.map((prov) => (
                    <option key={prov} value={prov} className="bg-[#0f172a] text-white">
                      {prov}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Wages Table */}
          <div className="flex-grow overflow-y-auto">
            <table className="w-full text-left text-[13px] relative">
              <thead className="text-slate-500 uppercase text-[9px] font-bold tracking-widest bg-slate-900/50 sticky top-0 z-10">
                <tr className="border-b border-white/5">
                  <th className="p-4 pl-6">Wilayah / Daerah</th>
                  <th className="p-4">Provinsi</th>
                  <th className="p-4 text-right">UMR 2025</th>
                  <th className="p-4 text-right">UMR 2026</th>
                  <th className="p-4 text-center pr-6">Kenaikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredWages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px] italic">
                      Daerah tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredWages.map((item) => {
                    const diff = item.wage2026 - item.wage2025;
                    const pctIncrease = ((diff / item.wage2025) * 100).toFixed(1);

                    return (
                      <tr 
                        key={item.name} 
                        onClick={() => {
                          setCalcProvince(item.province);
                          setTimeout(() => setCalcRegionName(item.name), 10);
                        }}
                        className="hover:bg-indigo-500/5 border-b border-white/5 group transition duration-150 cursor-pointer"
                      >
                        <td className="p-4 pl-6">
                          <div className="text-sm font-extrabold text-slate-200 group-hover:text-indigo-400 transition leading-tight">
                            {item.name}
                          </div>
                          <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 ${
                            item.type === 'UMP' 
                              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-400 text-xs">{item.province}</td>
                        <td className="p-4 text-right font-mono text-xs text-slate-500 font-semibold">{formatIDR(item.wage2025)}</td>
                        <td className="p-4 text-right font-mono text-xs text-indigo-300 font-extrabold">{formatIDR(item.wage2026)}</td>
                        <td className="p-4 text-center pr-6 font-mono text-[10px] font-black text-emerald-400">
                          +{pctIncrease}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Stats */}
          <div className="p-4 bg-slate-900/30 border-t border-white/5 text-[9px] text-slate-600 font-bold uppercase tracking-wider flex items-center justify-between px-6 shrink-0">
            <span>Total: {filteredWages.length} Daerah</span>
            <div className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Klik baris daerah untuk memasukkan ke kalkulator</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
