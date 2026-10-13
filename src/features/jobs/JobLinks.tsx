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

const ROW =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50';

/** Full-width rows of the reference links, for the details view. */
export function JobLinkList({ job }: { job: Job }) {
  const present = LINKS.filter(({ key }) => safeHref(job.links[key]));
  if (present.length === 0) return <p className="text-sm text-slate-400">No links added.</p>;
  return (
    <ul className="space-y-2">
      {present.map(({ key, label, icon: Icon }) => {
        const href = safeHref(job.links[key]);
        return (
          <li key={key}>
            <a href={href} target="_blank" rel="noopener noreferrer" className={ROW}>
              <Icon className="size-4 shrink-0 text-slate-500" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-900">{label}</span>
                <span className="block truncate text-xs text-slate-500">{new URL(href).host}</span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-slate-400" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** Full-width rows of the proof attachments, for the details view. */
export function AttachmentList({ urls }: { urls: string[] }) {
  const safe = urls.map(safeHref).filter(Boolean);
  if (safe.length === 0) return <p className="text-sm text-slate-400">No attachments.</p>;
  return (
    <ul className="space-y-2">
      {safe.map((url, i) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" className={ROW}>
            <Paperclip className="size-4 shrink-0 text-indigo-500" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-slate-900">Attachment {i + 1}</span>
              <span className="block truncate text-xs text-slate-500">Google Drive</span>
            </span>
            <ExternalLink className="size-4 shrink-0 text-slate-400" />
          </a>
        </li>
      ))}
    </ul>
  );
}
