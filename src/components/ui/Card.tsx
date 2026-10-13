import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TONES, type Tone } from '@/lib/tones';

export type Accent = Tone | 'rainbow';

export function AccentLine({ accent, className }: { accent: Accent; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('absolute inset-x-0 top-0 h-1', accent === 'rainbow' ? 'accent-rainbow' : TONES[accent].bar, className)}
    />
  );
}

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Coloured line along the top edge. */
  accent?: Accent;
}

export function Card({ accent, className, children, ...props }: CardProps) {
  return (
    <section
      className={cn('relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    >
      {accent && <AccentLine accent={accent} />}
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, icon, className }: CardHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-3 px-5 pt-5 pb-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />;
}
