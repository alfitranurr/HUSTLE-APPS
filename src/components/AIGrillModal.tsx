/* cspell:disable */
'use client';

import React, { useState } from 'react';
import { X, Flame, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { InterviewQuestion } from '@/lib/googleSheets';

interface AIGrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: InterviewQuestion | null;
}

interface GrillFeedback {
  score: number;
  overallFeedback: string;
  starAnalysis: {
    situationFeedback: string;
    taskFeedback: string;
    actionFeedback: string;
    resultFeedback: string;
  };
  suggestions: string[];
}

export const AIGrillModal: React.FC<AIGrillModalProps> = ({
  isOpen,
  onClose,
  question,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<GrillFeedback | null>(null);

  if (!isOpen || !question) return null;

  const handleRunGrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() && !question.action) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/interviews/grill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          answer: userAnswer,
          category: question.category,
          situation: question.situation,
          task: question.task,
          action: question.action,
          result: question.result,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="p-6 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wide flex items-center gap-2">
                AI Grill Mode Simulator
                <span className="text-[9px] not-italic font-black bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md uppercase">
                  Interactive
                </span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Simulasi wawancara & evaluasi instant jawaban Anda dengan kerangka STAR.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 no-scrollbar">

        {/* Question Card Box */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-indigo-400">
            <span>{question.category}</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300">{question.difficulty}</span>
          </div>
          <h4 className="text-sm font-bold text-white leading-snug">
            &quot;{question.question}&quot;
          </h4>
        </div>

        {/* Answer Input Form */}
        <form onSubmit={handleRunGrill} className="space-y-4 text-left">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tulis / Tempel Jawaban Latihan Anda:
              </label>
              {question.action && (
                <button
                  type="button"
                  onClick={() => setUserAnswer(`Situation: ${question.situation}\nTask: ${question.task}\nAction: ${question.action}\nResult: ${question.result}`)}
                  className="text-[9.5px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Gunakan Draf STAR Tersimpan
                </button>
              )}
            </div>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Tuliskan jawaban langsung Anda saat wawancara..."
              rows={5}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || (!userAnswer.trim() && !question.action)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-black text-white transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Menganalisis Jawaban AI...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Uji Jawaban Dengan AI Grill</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI Feedback Results Box */}
        {feedback && (
          <div className="p-5 rounded-3xl bg-slate-950 border border-indigo-500/30 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Hasil Evaluasi AI Grill
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Score:</span>
                <span className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${
                  feedback.score >= 85 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : feedback.score >= 70
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {feedback.score}/100
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {feedback.overallFeedback}
            </p>

            {/* STAR Analysis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-indigo-400 uppercase">Situation (Latar Belakang)</span>
                <p className="text-[10.5px] text-slate-300">{feedback.starAnalysis.situationFeedback}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-purple-400 uppercase">Task (Tanggung Jawab)</span>
                <p className="text-[10.5px] text-slate-300">{feedback.starAnalysis.taskFeedback}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-pink-400 uppercase">Action (Tindakan Spesifik)</span>
                <p className="text-[10.5px] text-slate-300">{feedback.starAnalysis.actionFeedback}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-emerald-400 uppercase">Result (Metrik / Dampak)</span>
                <p className="text-[10.5px] text-slate-300">{feedback.starAnalysis.resultFeedback}</p>
              </div>
            </div>

            {/* Actionable Suggestions */}
            {feedback.suggestions.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Saran Perbaikan Kunci:
                </span>
                <ul className="space-y-1.5">
                  {feedback.suggestions.map((sug, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
