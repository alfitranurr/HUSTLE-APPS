import 'server-only';
import { getServerEnv } from '@/lib/env';
import { sheets } from './client';

/** Thin helpers over the Sheets API. All writes use RAW to block formula injection. */

const spreadsheetId = () => getServerEnv().GOOGLE_SHEET_ID;

/** 1 -> A, 19 -> S, 27 -> AA */
export function columnLetter(n: number): string {
  let letters = '';
  for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) letters = String.fromCharCode(65 + ((i - 1) % 26)) + letters;
  return letters;
}

// Sheet ids never change, so cache them for the life of the instance.
const sheetIds = new Map<string, number>();

async function getSheetId(title: string): Promise<number | undefined> {
  if (sheetIds.has(title)) return sheetIds.get(title);
  const res = await sheets().spreadsheets.get({ spreadsheetId: spreadsheetId(), fields: 'sheets.properties' });
  for (const s of res.data.sheets ?? []) {
    if (s.properties?.title && s.properties.sheetId != null) sheetIds.set(s.properties.title, s.properties.sheetId);
  }
  return sheetIds.get(title);
}

/** Creates the tab with a frozen header row if it doesn't exist yet. */
export async function ensureSheet(title: string, headers: readonly string[]): Promise<void> {
  if ((await getSheetId(title)) !== undefined) return;
  const res = await sheets().spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] },
  });
  const id = res.data.replies?.[0]?.addSheet?.properties?.sheetId;
  if (id != null) sheetIds.set(title, id);
  await writeValues(`${title}!A1`, [[...headers]]);
}

export async function readValues(range: string): Promise<string[][]> {
  const res = await sheets().spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range });
  return (res.data.values ?? []).map((row) => row.map((cell) => (cell == null ? '' : String(cell).trim())));
}

export async function writeValues(range: string, values: string[][]): Promise<void> {
  await sheets().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

export async function appendRow(range: string, values: string[]): Promise<void> {
  await appendRows(range, [values]);
}

/** Appends many rows in one request (RAW). */
export async function appendRows(range: string, rows: string[][]): Promise<void> {
  if (rows.length === 0) return;
  await sheets().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
}

/** Writes many ranges in one request (RAW). */
export async function batchWriteValues(data: { range: string; values: string[][] }[]): Promise<void> {
  if (data.length === 0) return;
  await sheets().spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: { valueInputOption: 'RAW', data },
  });
}

/** Deletes several rows in one request. Bottom-up so earlier deletions don't shift later ones. */
export async function deleteRows(title: string, rowNumbers: number[]): Promise<void> {
  if (rowNumbers.length === 0) return;
  const sheetId = await getSheetId(title);
  if (sheetId === undefined) throw new Error(`Sheet '${title}' not found`);
  const requests = [...new Set(rowNumbers)]
    .sort((a, b) => b - a)
    .map((row) => ({ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row } } }));
  await sheets().spreadsheets.batchUpdate({ spreadsheetId: spreadsheetId(), requestBody: { requests } });
}

/** Deletes a whole row (1-based row number) so later rows shift up. */
export async function deleteRow(title: string, rowNumber: number): Promise<void> {
  const sheetId = await getSheetId(title);
  if (sheetId === undefined) throw new Error(`Sheet '${title}' not found`);
  await sheets().spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber },
          },
        },
      ],
    },
  });
}

export class NotFoundError extends Error {}
