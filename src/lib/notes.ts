/**
 * An application's note is plain text, one point per line, "Label: detail"
 * when the point has a label. Shared by the note editor, the note list and the
 * MCP tools, so a note written by an AI assistant reads like one typed in the form.
 */

export interface NotePoint {
  label?: string;
  text: string;
}

/** "Found on: Instagram" → label + text. Not for URLs ("https://…") or long sentences with a colon. */
const LABELLED = /^([^:]{1,40}?)\s*:\s*(.*)$/;

export function parseNote(note: string): NotePoint[] {
  return note
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^([-•*·]|\d+[.)])\s+/, ''))
    .filter(Boolean)
    .map((line) => {
      const match = LABELLED.exec(line);
      if (!match || /https?$/i.test(match[1]) || match[1].split(' ').length > 5) return { text: line };
      return { label: match[1], text: match[2] };
    });
}

/** Points → stored note. Labels can't contain a colon (it would split differently when read back). */
export function serialiseNote(points: NotePoint[]): string {
  return points
    .map(({ label, text }) => ({ label: (label ?? '').replace(/:/g, ' ').trim(), text: text.replace(/\s*\n\s*/g, ' ').trim() }))
    .filter(({ label, text }) => label || text)
    .map(({ label, text }) => (label ? `${label}: ${text}` : text))
    .join('\n');
}
