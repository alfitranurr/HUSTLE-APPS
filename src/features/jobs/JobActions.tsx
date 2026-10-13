import { Eye, Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import type { Job } from '@/lib/types';

export interface JobActionHandlers {
  onView: (job: Job) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}

export function JobActions({ job, onView, onEdit, onDelete }: JobActionHandlers & { job: Job }) {
  return (
    <div className="flex items-center gap-0.5">
      <IconButton label={`View ${job.company}`} icon={<Eye className="size-4" />} onClick={() => onView(job)} />
      <IconButton label={`Edit ${job.company}`} icon={<Pencil className="size-4" />} onClick={() => onEdit(job)} />
      <IconButton
        label={`Delete ${job.company}`}
        icon={<Trash2 className="size-4" />}
        onClick={() => onDelete(job)}
        className="hover:bg-rose-50 hover:text-rose-600"
      />
    </div>
  );
}
