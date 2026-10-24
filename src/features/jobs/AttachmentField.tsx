'use client';

import { FileText, Paperclip, UploadCloud, X } from 'lucide-react';
import { useRef } from 'react';
import { IconButton } from '@/components/ui/Button';
import { ACCEPTED_UPLOADS, MAX_UPLOAD_FILE_MB, MAX_UPLOAD_FILES } from '@/lib/constants';
import type { Attachment } from '@/lib/types';

const ACCEPTED_EXTENSIONS = ACCEPTED_UPLOADS.split(',');
const MAX_TOTAL_MB = 4.4;

/** Returns an error message if the selection breaks the upload rules, else null. */
export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_UPLOAD_FILES) return `Attach at most ${MAX_UPLOAD_FILES} files at a time.`;
  for (const file of files) {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) return `"${file.name}" must be a PDF, PNG, JPG or WebP file.`;
    if (file.size > MAX_UPLOAD_FILE_MB * 1024 * 1024) return `"${file.name}" is larger than ${MAX_UPLOAD_FILE_MB} MB.`;
  }
  const totalMb = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
  if (totalMb > MAX_TOTAL_MB) return `New files add up to ${totalMb.toFixed(1)} MB; the limit is ${MAX_TOTAL_MB} MB.`;
  return null;
}

interface AttachmentFieldProps {
  existing: Attachment[];
  onRemoveExisting: (id: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  error?: string;
  disabled?: boolean;
}

export function AttachmentField({ existing, onRemoveExisting, files, onFilesChange, error, disabled }: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">Proof of application</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-slate-200 px-4 py-5 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 disabled:cursor-not-allowed"
      >
        <UploadCloud className="size-6 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">Click to add files</span>
        <span className="text-xs text-slate-500">
          PDF, PNG, JPG or WebP · up to {MAX_UPLOAD_FILE_MB} MB each · {MAX_UPLOAD_FILES} files max
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_UPLOADS}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onFilesChange([...files, ...Array.from(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {(existing.length > 0 || files.length > 0) && (
        <ul className="mt-3 space-y-1.5">
          {existing.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 text-indigo-700 hover:underline"
              >
                <Paperclip className="size-4 shrink-0" />
                <span className="truncate">{file.name}</span>
              </a>
              <IconButton
                label={`Remove ${file.name}`}
                icon={<X className="size-4" />}
                onClick={() => onRemoveExisting(file.id)}
                disabled={disabled}
              />
            </li>
          ))}
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                <FileText className="size-4 shrink-0 text-slate-400" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </span>
              <IconButton
                label={`Remove ${file.name}`}
                icon={<X className="size-4" />}
                onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
