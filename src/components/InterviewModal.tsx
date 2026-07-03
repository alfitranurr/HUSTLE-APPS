/* cspell:disable */
'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { InterviewQuestion } from '@/lib/googleSheets';

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<InterviewQuestion, 'id' | 'rownum'>, editId?: string) => Promise<void>;
  editQuestion?: InterviewQuestion | null;
}

const CATEGORIES = ['Behavioral', 'Technical', 'HR / General', 'System Design', 'Leadership', 'Salary & Culture'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const STATUSES = ['Practice Needed', 'Mastered'] as const;

export const InterviewModal: React.FC<InterviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editQuestion,
}) => {
  const [category, setCategory] = useState(editQuestion?.category || 'Behavioral');
  const [question, setQuestion] = useState(editQuestion?.question || '');
  const [situation, setSituation] = useState(editQuestion?.situation || '');
  const [task, setTask] = useState(editQuestion?.task || '');
  const [action, setAction] = useState(editQuestion?.action || '');
  const [result, setResult] = useState(editQuestion?.result || '');
  const [targetcompany, setTargetcompany] = useState(editQuestion?.targetcompany || '');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(editQuestion?.difficulty || 'Medium');
  const [status, setStatus] = useState<'Mastered' | 'Practice Needed'>(editQuestion?.status || 'Practice Needed');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      await onSave(
        {
          category,
          question,
          situation,
          task,
          action,
          result,
          targetcompany,
          difficulty,
          status,
        },
        editQuestion?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="p-6 border-b border-white/10 shrink-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wide">
                {editQuestion ? 'Edit Interview Question' : 'Tambah Pertanyaan Latihan'}
              </h3>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Simpan pertanyaan wawancara lengkap dengan struktur skenario **STAR Method**.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="interview-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-left flex-1 no-scrollbar">
          {/* Question Input */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pertanyaan Interview *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Contoh: Ceritakan pengalaman Anda saat menangani konflik teknis dalam tim."
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Row 1: Category & Target Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Kategori Pertanyaan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Target Perusahaan (Opsional)
              </label>
              <input
                type="text"
                value={targetcompany}
                onChange={(e) => setTargetcompany(e.target.value)}
                placeholder="Contoh: Shopee, GoTo, Bank BCA"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Row 2: Difficulty & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tingkat Kesulitan
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold transition border cursor-pointer ${
                      difficulty === d
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status Penguasaan
              </label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-extrabold transition border cursor-pointer ${
                      status === s
                        ? s === 'Mastered'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s === 'Mastered' ? '🏆 Mastered' : '💪 Practice Needed'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STAR Method Section */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
              Jawaban Metode STAR (Situation, Task, Action, Result)
            </span>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Situation (S) — Latar Belakang & Konteks
              </label>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Deskripsikan konteks tempat/proyek saat masalah terjadi..."
                rows={2}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Task (T) — Tantangan & Target Tugas Anda
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Tanggung jawab spesifik yang harus Anda selesaikan..."
                rows={2}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Action (A) — Langkah Konkret Individu yang Anda Ambil
              </label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Langkah teknis / komunikasi aktif yang Anda lakukan..."
                rows={2}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Result (R) — Hasil Akhir & Dampak Kuantitatif
              </label>
              <textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Hasil akhir yang dicapai (misal: efisiensi meningkat 40%, lulus tepat waktu)..."
                rows={2}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>
          </div>
        </form>

        {/* Sticky Modal Footer */}
        <div className="p-4 px-6 border-t border-white/10 shrink-0 bg-slate-950/60 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="interview-form"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Pertanyaan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
