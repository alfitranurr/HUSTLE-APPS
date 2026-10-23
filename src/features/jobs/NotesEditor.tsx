'use client';

import { Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { parseNote } from './NoteList';

/**
 * Edits an application's note as separate points ("Label: detail" per line).
 * The note is still stored as plain text, one point per line, so older notes
 * open already split into points.
 */

const QUICK_LABELS = ['Found on', 'Applied via', 'Salary', 'Recruiter', 'Next step'];
const MAX_LENGTH = 5000;

interface Row {
  id: number;
  label: string;
  text: string;
}

const serialise = (rows: Row[]) =>
  rows
    .map(({ label, text }) => ({ label: label.trim(), text: text.replace(/\s*\n\s*/g, ' ').trim() }))
    .filter(({ label, text }) => label || text)
    .map(({ label, text }) => (label ? `${label}: ${text}` : text))
    .join('\n');

export function NotesEditor({ value, onChange }: { value: string; onChange: (note: string) => void }) {
  const [rows, setRows] = useState<Row[]>(() => {
    const parsed = parseNote(value).map((line, id) => ({ id, label: line.label ?? '', text: line.text }));
    return parsed.length > 0 ? parsed : [{ id: 0, label: '', text: '' }];
  });
  const makeRow = (label = ''): Row => ({ id: Math.max(-1, ...rows.map((r) => r.id)) + 1, label, text: '' });
  const focusId = useRef<number | null>(null);

  const update = (next: Row[]) => {
    setRows(next);
    onChange(serialise(next));
  };
  const change = (id: number, field: 'label' | 'text', text: string) =>
    // A colon would split the point differently when read back, so labels can't contain one.
    update(rows.map((row) => (row.id === id ? { ...row, [field]: field === 'label' ? text.replace(/:/g, '') : text } : row)));
  const add = (label = '') => {
    const row = makeRow(label);
    focusId.current = row.id;
    // Fill an empty last row instead of stacking blanks.
    const last = rows.at(-1);
    update(last && !last.label && !last.text ? [...rows.slice(0, -1), row] : [...rows, row]);
  };
  const remove = (id: number) => {
    const next = rows.filter((row) => row.id !== id);
    update(next.length > 0 ? next : [makeRow()]);
  };

  const used = new Set(rows.map((row) => row.label.trim().toLowerCase()));
  const unusedLabels = QUICK_LABELS.filter((label) => !used.has(label.toLowerCase()));

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={row.id} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] items-start gap-2">
            <Input
              aria-label={`Point ${i + 1} label`}
              placeholder="Label"
              value={row.label}
              maxLength={40}
              onChange={(e) => change(row.id, 'label', e.target.value)}
              className="font-medium"
            />
            <Textarea
              ref={(el) => {
                if (el && focusId.current === row.id) {
                  focusId.current = null;
                  (row.label ? el : (el.previousElementSibling as HTMLElement | null) ?? el).focus();
                }
              }}
              aria-label={`Point ${i + 1}`}
              placeholder="Detail"
              rows={1}
              value={row.text}
              onChange={(e) => change(row.id, 'text', e.target.value)}
              onKeyDown={(e) => {
                // Enter starts a new point; each point stays on one line.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  add();
                }
              }}
              className="min-h-10 resize-none [field-sizing:content]"
            />
            <IconButton
              label={`Remove point ${i + 1}`}
              icon={<X className="size-4" />}
              onClick={() => remove(row.id)}
              className="mt-1 hover:bg-rose-50 hover:text-rose-600"
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="secondary" size="sm" icon={<Plus className="size-3.5" />} onClick={() => add()}>
          Add point
        </Button>
        {unusedLabels.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => add(label)}
            className="cursor-pointer rounded-full px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50 hover:text-slate-900"
          >
            + {label}
          </button>
        ))}
        {value.length > MAX_LENGTH * 0.9 && (
          <span className={value.length > MAX_LENGTH ? 'text-xs text-rose-600' : 'text-xs text-slate-500'}>
            {value.length}/{MAX_LENGTH}
          </span>
        )}
      </div>
    </div>
  );
}
