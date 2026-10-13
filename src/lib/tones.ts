/**
 * Colour "tones" used for the accent-line design system. Every class is written
 * out literally so Tailwind can detect it at build time.
 */
export type Tone =
  | 'indigo'
  | 'sky'
  | 'cyan'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'violet'
  | 'fuchsia'
  | 'slate';

interface ToneClasses {
  /** Solid fill for accent lines, bars and dots. */
  bar: string;
  /** Left border colour for list rows / cards. */
  edge: string;
  /** Soft pill styling. */
  badge: string;
  /** Foreground text colour. */
  text: string;
  /** Very light background. */
  soft: string;
  /** Raw colour for charts / SVG. */
  hex: string;
}

export const TONES: Record<Tone, ToneClasses> = {
  indigo: {
    bar: 'bg-indigo-500',
    edge: 'border-l-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    text: 'text-indigo-600',
    soft: 'bg-indigo-50',
    hex: '#6366f1',
  },
  sky: {
    bar: 'bg-sky-500',
    edge: 'border-l-sky-500',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    text: 'text-sky-600',
    soft: 'bg-sky-50',
    hex: '#0ea5e9',
  },
  cyan: {
    bar: 'bg-cyan-500',
    edge: 'border-l-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
    text: 'text-cyan-600',
    soft: 'bg-cyan-50',
    hex: '#06b6d4',
  },
  teal: {
    bar: 'bg-teal-500',
    edge: 'border-l-teal-500',
    badge: 'bg-teal-50 text-teal-700 ring-teal-600/20',
    text: 'text-teal-600',
    soft: 'bg-teal-50',
    hex: '#14b8a6',
  },
  emerald: {
    bar: 'bg-emerald-500',
    edge: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    text: 'text-emerald-600',
    soft: 'bg-emerald-50',
    hex: '#10b981',
  },
  amber: {
    bar: 'bg-amber-400',
    edge: 'border-l-amber-400',
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    text: 'text-amber-600',
    soft: 'bg-amber-50',
    hex: '#f59e0b',
  },
  orange: {
    bar: 'bg-orange-500',
    edge: 'border-l-orange-500',
    badge: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    text: 'text-orange-600',
    soft: 'bg-orange-50',
    hex: '#f97316',
  },
  rose: {
    bar: 'bg-rose-500',
    edge: 'border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    text: 'text-rose-600',
    soft: 'bg-rose-50',
    hex: '#f43f5e',
  },
  violet: {
    bar: 'bg-violet-500',
    edge: 'border-l-violet-500',
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    text: 'text-violet-600',
    soft: 'bg-violet-50',
    hex: '#8b5cf6',
  },
  fuchsia: {
    bar: 'bg-fuchsia-500',
    edge: 'border-l-fuchsia-500',
    badge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20',
    text: 'text-fuchsia-600',
    soft: 'bg-fuchsia-50',
    hex: '#d946ef',
  },
  slate: {
    bar: 'bg-slate-400',
    edge: 'border-l-slate-300',
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    text: 'text-slate-600',
    soft: 'bg-slate-100',
    hex: '#94a3b8',
  },
};

/** Rotating palette for charts with arbitrary categories. */
export const CHART_TONES: Tone[] = ['indigo', 'sky', 'emerald', 'amber', 'fuchsia', 'teal', 'orange', 'violet'];
