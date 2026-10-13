import { ExternalLink, Globe, Paperclip } from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from '@/components/BrandIcons';
import { cn } from '@/lib/cn';
import type { Job } from '@/lib/types';
import { safeHref } from '@/lib/urls';

const LINKS = [
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, hover: 'hover:text-blue-600 hover:bg-blue-50' },
  { key: 'instagram', label: 'Instagram', icon: InstagramIcon, hover: 'hover:text-pink-600 hover:bg-pink-50' },
  { key: 'website', label: 'Website', icon: Globe, hover: 'hover:text-indigo-600 hover:bg-indigo-50' },
  { key: 'other', label: 'Other link', icon: ExternalLink, hover: 'hover:text-emerald-600 hover:bg-emerald-50' },
] as const;

export function hasLinks(job: Job) {
  return LINKS.some(({ key }) => safeHref(job.links[key]));
}

/** Compact icon row of the company's reference links. */
export function JobLinkIcons({ job, className }: { job: Job; className?: string }) {
  const present = LINKS.filter(({ key }) => safeHref(job.links[key]));
  if (present.length === 0) return null;
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {present.map(({ key, label, icon: Icon, hover }) => (
        <a
          key={key}
          href={safeHref(job.links[key])}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} for ${job.company}`}
          title={label}
          className={cn('grid size-7 place-items-center rounded-md text-slate-400 transition-colors', hover)}
        >
          <Icon className="size-3.5" />
        </a>
      ))}
    </div>
  );
}

/** Labelled link buttons, used in the details view. */
export function JobLinkButtons({ job }: { job: Job }) {
  const present = LINKS.filter(({ key }) => safeHref(job.links[key]));
  if (present.length === 0) return <p className="text-sm text-slate-500">No links added.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {present.map(({ key, label, icon: Icon, hover }) => (
        <a
          key={key}
          href={safeHref(job.links[key])}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors',
            hover
          )}
        >
          <Icon className="size-4" />
          {label}
        </a>
      ))}
    </div>
  );
}

export function AttachmentLinks({ urls, compact = false }: { urls: string[]; compact?: boolean }) {
  const safe = urls.map(safeHref).filter(Boolean);
  if (safe.length === 0) return compact ? null : <p className="text-sm text-slate-500">No attachments.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {safe.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          <Paperclip className="size-3" />
          {safe.length > 1 ? `File ${i + 1}` : 'Attachment'}
        </a>
      ))}
    </div>
  );
}
