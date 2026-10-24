import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Small label after the title, e.g. a "Beta" badge. */
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, badge, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <span aria-hidden className="mb-3 block h-1 w-10 rounded-full bg-indigo-600" />
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          {title}
          {badge}
        </h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
