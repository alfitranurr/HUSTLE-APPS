/**
 * Shows an application's free-text note as bullet points, one per line.
 * "Label: value" lines get a bold label; existing "- " / "• " markers are
 * dropped so they aren't doubled. A single unlabeled line stays a paragraph.
 */

import { parseNote } from '@/lib/notes';

// Re-exported for the note editor.
export { parseNote };

export function NoteList({ note }: { note: string }) {
  const lines = parseNote(note);
  if (lines.length === 1 && !lines[0].label) {
    return <p className="text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{lines[0].text}</p>;
  }
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-400" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {line.label && <span className="font-semibold text-slate-900">{line.label}: </span>}
            {line.text || <span className="text-slate-400">–</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
