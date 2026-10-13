import { cn } from '@/lib/cn';

/** Full-screen branded loader for the first load of the app. */
export function SplashScreen({ message = 'Loading your workspace…', className }: { message?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('fixed inset-0 z-[90] flex flex-col items-center justify-center bg-white', className)}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20">
        H
      </span>
      <p className="mt-4 text-base font-semibold text-slate-900">Hustle</p>
      <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-indigo-100">
        <div className="h-full w-2/5 rounded-full bg-indigo-600 animate-splash" />
      </div>
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}
