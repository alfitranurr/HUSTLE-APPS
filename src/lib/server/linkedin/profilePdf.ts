import 'server-only';
import { getDocumentProxy } from 'unpdf';
import { parseProfileText } from '@/lib/linkedin/parseProfile';
import type { CandidateProfile } from '@/lib/types';

interface TextItem {
  str: string;
  transform: number[];
}

/**
 * Left edge of the main column: the most common x position right of the first
 * fifth of the page (the sidebar sits left of it). Falls back to a third of the width.
 */
function mainColumnLeft(items: TextItem[], width: number): number {
  const counts = new Map<number, number>();
  for (const item of items) {
    const x = Math.round(item.transform[4]);
    if (item.str.trim() && x > width * 0.2) counts.set(x, (counts.get(x) ?? 0) + 1);
  }
  const [best] = [...counts].sort((a, b) => b[1] - a[1]);
  return best ? best[0] - 5 : width / 3;
}

/**
 * Extracts the text of a LinkedIn profile PDF as two line lists. Items are
 * grouped into lines by their y position; anything left of the main column
 * (found on the first page) belongs to the sidebar.
 */
async function pdfLines(data: Uint8Array): Promise<{ sidebar: string[]; main: string[] }> {
  const pdf = await getDocumentProxy(data);
  const sidebar: string[] = [];
  const main: string[] = [];
  let mainLeft: number | undefined;

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 10); pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const width = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const items = (content.items as TextItem[]).filter((item) => 'str' in item && item.str.trim());
    mainLeft ??= mainColumnLeft(items, width);
    const rows = new Map<string, { y: number; x: number; parts: { x: number; text: string }[] }>();

    for (const item of items) {
      const [, , , , x, y] = item.transform;
      const column = x < mainLeft ? 'side' : 'main';
      const key = `${column}:${Math.round(y)}`;
      const row = rows.get(key) ?? { y, x, parts: [] };
      row.parts.push({ x, text: item.str });
      row.x = Math.min(row.x, x);
      rows.set(key, row);
    }

    // PDF y grows upwards, so read rows from the top of the page down.
    for (const [key, row] of [...rows].sort((a, b) => b[1].y - a[1].y)) {
      const text = row.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      (key.startsWith('side') ? sidebar : main).push(text);
    }
  }
  return { sidebar, main };
}

export async function parseProfilePdf(data: Uint8Array): Promise<Omit<CandidateProfile, 'parsedAt'>> {
  const { sidebar, main } = await pdfLines(data);
  if (main.length === 0) throw new Error('No text found in the PDF');
  return parseProfileText(sidebar, main);
}
