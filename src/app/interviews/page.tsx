/* cspell:disable */
'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { 
  Plus, 
  Search, 
  Flame, 
  RotateCw, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Building2, 
  BookOpen, 
  Check
} from 'lucide-react';
import { InterviewQuestion } from '@/lib/googleSheets';
import { InterviewModal } from '@/components/InterviewModal';
import { AIGrillModal } from '@/components/AIGrillModal';

const DEFAULT_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'iq_default_1',
    category: 'Behavioral',
    question: 'Ceritakan situasi ketika Anda harus menyelesaikan proyek dengan deadline yang sangat ketat.',
    situation: 'Saat menangani pembuatan fitur Job Tracker di mana batas waktu tersisa 3 hari sebelum demo rilis.',
    task: 'Harus merancang skema database, backend API, dan UI frontend yang responsif tanpa bug.',
    action: 'Saya membagi tugas ke dalam modul prioritas utama, mengimplementasikan caching SWR, dan fokus pada alur fungsional inti.',
    result: 'Proyek selesai tepat waktu, performa aplikasi cepat, dan demo berhasil berjalan lancar tanpa kendala.',
    targetcompany: 'Tech Startup / Corporate',
    difficulty: 'Medium',
    status: 'Mastered',
    rownum: 2,
  },
  {
    id: 'iq_default_2',
    category: 'Technical',
    question: 'Bagaimana cara Anda mengoptimalkan performa rendering komponen pada aplikasi Next.js / React?',
    situation: 'Ketika aplikasi mulai lambat akibat re-rendering berlebihan pada tabel data yang berisi ratusan baris.',
    task: 'Meningkatkan respon UI agar tidak patah-patah saat user melakukan pencarian dan pagination.',
    action: 'Saya menerapkan hook useMemo untuk komputasi filter/sorting data, React.memo untuk komponen tabel, dan virtualisasi pagination.',
    result: 'Waktu render berkurang dari 350ms menjadi 12ms (efisiensi meningkat 96%).',
    targetcompany: 'Unicorn / Tech Company',
    difficulty: 'Hard',
    status: 'Practice Needed',
    rownum: 3,
  },
  {
    id: 'iq_default_3',
    category: 'HR / General',
    question: 'Mengapa Anda tertarik melamar pada posisi ini dan apa ekspektasi kontribusi Anda?',
    situation: 'Melihat fokus perusahaan pada inovasi produk digital skala besar.',
    task: 'Menunjukkan keselarasan antara latar belakang skill saya dengan kebutuhan strategi tim.',
    action: 'Saya mempelajari ekosistem produk perusahaan, lalu menyiapkan proposal kontribusi pada efisiensi alur kerja produk.',
    result: 'Pewawancara mengapresiasi pemahaman mendalam saya terhadap produk perusahaan.',
    targetcompany: 'Top Enterprise',
    difficulty: 'Easy',
    status: 'Mastered',
    rownum: 4,
  },
];

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch');
  }
  return res.json();
};

export default function InterviewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [expandedStarId, setExpandedStarId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);

  const [isGrillOpen, setIsGrillOpen] = useState(false);
  const [grillQuestion, setGrillQuestion] = useState<InterviewQuestion | null>(null);

  const { data, isLoading, isValidating, mutate } = useSWR('/api/interviews', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const questions: InterviewQuestion[] = useMemo(() => {
    const fetched = data?.data || [];
    return fetched.length > 0 ? fetched : DEFAULT_QUESTIONS;
  }, [data]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = questions.length;
    const mastered = questions.filter((q) => q.status === 'Mastered').length;
    const practiceNeeded = total - mastered;
    const targetCompanies = new Set(questions.map((q) => q.targetcompany).filter(Boolean)).size;

    return { total, mastered, practiceNeeded, targetCompanies };
  }, [questions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchQuery =
        !searchQuery ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.targetcompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
      const matchStat = selectedStatus === 'All' || q.status === selectedStatus;

      return matchQuery && matchCat && matchDiff && matchStat;
    });
  }, [questions, searchQuery, selectedCategory, selectedDifficulty, selectedStatus]);

  // Handlers
  const handleSaveQuestion = async (
    formData: Omit<InterviewQuestion, 'id' | 'rownum'>,
    editId?: string
  ) => {
    if (editId) {
      await fetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...formData }),
      });
    } else {
      await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }
    mutate();
  };

  const handleToggleStatus = async (q: InterviewQuestion) => {
    const newStatus = q.status === 'Mastered' ? 'Practice Needed' : 'Mastered';
    await fetch('/api/interviews', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id, status: newStatus }),
    });
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pertanyaan latihan ini?')) {
      await fetch(`/api/interviews?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      mutate();
    }
  };

  const handleOpenGrill = (q: InterviewQuestion) => {
    setGrillQuestion(q);
    setIsGrillOpen(true);
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl 2xl:max-w-[1600px] mx-auto w-full flex-grow space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase italic">
            Interview Practice & Bank Pertanyaan
            <span className="bg-indigo-500/15 text-indigo-400 text-[9px] not-italic font-black tracking-widest px-2 py-0.5 rounded-md border border-indigo-500/20 uppercase">
              STAR METHOD
            </span>
          </h2>
          <p className="text-slate-500 text-[11px] font-medium mt-1">
            Simpan, latih, dan uji jawaban wawancara kerja Anda dengan simulator AI Grill.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => mutate()}
            disabled={isLoading || isValidating}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0 disabled:opacity-50"
            title="Sync Data"
          >
            <RotateCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pertanyaan</span>
          </button>
        </div>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="glass p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Pertanyaan</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1">Bank Pertanyaan</p>
          <h2 className="text-3xl font-black text-white">{stats.total}</h2>
        </div>

        {/* Mastered */}
        <div className="glass p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Mastered</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1">Dikuasai</p>
          <h2 className="text-3xl font-black text-emerald-400">{stats.mastered}</h2>
        </div>

        {/* Practice Needed */}
        <div className="glass p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Practice Needed</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1">Perlu Latihan</p>
          <h2 className="text-3xl font-black text-amber-400">{stats.practiceNeeded}</h2>
        </div>

        {/* Target Companies */}
        <div className="glass p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500" />
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Target Perusahaan</p>
          <p className="text-[9px] text-slate-600 font-medium mb-1">Spesifik PT</p>
          <h2 className="text-3xl font-black text-purple-400">{stats.targetCompanies}</h2>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan, perusahaan..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Category & Status Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">Semua Kategori</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Technical">Technical</option>
            <option value="HR / General">HR / General</option>
            <option value="System Design">System Design</option>
          </select>

          {/* Difficulty Selector */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-950 border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">Semua Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">Semua Status</option>
            <option value="Mastered">🏆 Mastered</option>
            <option value="Practice Needed">💪 Practice Needed</option>
          </select>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => {
            const isExpanded = expandedStarId === q.id;
            const isMastered = q.status === 'Mastered';

            return (
              <div
                key={q.id}
                className="glass rounded-3xl p-5 md:p-6 space-y-4 transition border border-white/10 hover:border-white/20"
              >
                {/* Card Top Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase">
                        {q.category}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : q.difficulty === 'Hard'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {q.difficulty}
                      </span>

                      {q.targetcompany && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          {q.targetcompany}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug pt-1">
                      &quot;{q.question}&quot;
                    </h3>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    {/* Toggle Mastery Button */}
                    <button
                      onClick={() => handleToggleStatus(q)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition cursor-pointer border flex items-center gap-1.5 ${
                        isMastered
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                      title="Toggle Status Penguasaan"
                    >
                      {isMastered ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Mastered</span>
                        </>
                      ) : (
                        <span>Mark as Mastered</span>
                      )}
                    </button>

                    {/* AI Grill Button */}
                    <button
                      onClick={() => handleOpenGrill(q)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-black transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI Grill</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* STAR Section Expansion Toggle */}
                <div>
                  <button
                    onClick={() => setExpandedStarId(isExpanded ? null : q.id)}
                    className="text-xs font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{isExpanded ? 'Sembunyikan Jawaban STAR' : 'Lihat Draf Jawaban STAR'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/5 animate-in fade-in duration-200">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">
                          S — Situation
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {q.situation || 'Belum diisi'}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider block">
                          T — Task
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {q.task || 'Belum diisi'}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[9px] font-black text-pink-400 uppercase tracking-wider block">
                          A — Action
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {q.action || 'Belum diisi'}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">
                          R — Result
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {q.result || 'Belum diisi'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass rounded-3xl p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase">
              Tidak ada pertanyaan yang sesuai dengan filter pencarian
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <InterviewModal
        key={editingQuestion?.id || (isModalOpen ? 'open' : 'closed')}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveQuestion}
        editQuestion={editingQuestion}
      />

      <AIGrillModal
        isOpen={isGrillOpen}
        onClose={() => setIsGrillOpen(false)}
        question={grillQuestion}
      />
    </main>
  );
}
