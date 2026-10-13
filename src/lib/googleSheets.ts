/* cspell:disable */
import 'server-only';
import { Readable } from 'node:stream';
import { google, type drive_v3, type sheets_v4 } from 'googleapis';
import { JWT, OAuth2Client } from 'google-auth-library';
import { getServerEnv } from './env';
import type { InterviewQuestion, Job } from './types';

export type { InterviewQuestion, Job };

const SHEET_NAME = 'DataLowongan';
const INTERVIEWS_SHEET_NAME = 'Interviews';

const JOB_HEADERS = [
  'ID', 'Timestamp', 'Company', 'StartDate', 'EndDate', 'Status', 'Instagram', 'LinkedIn', 'Web',
  'Kategori', 'Note', 'BuktiURL', 'Platform', 'CareerLevel', 'CurrentStage', 'Province', 'City', 'OtherLink',
];
const INTERVIEW_HEADERS = [
  'ID', 'Category', 'Question', 'Situation', 'Task', 'Action', 'Result', 'TargetCompany', 'Difficulty', 'Status',
];

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

let authClient: OAuth2Client | JWT | undefined;

function getAuthClient(): OAuth2Client | JWT {
  if (authClient) return authClient;
  const env = getServerEnv();

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
    const oauth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
    oauth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });
    authClient = oauth;
    return oauth;
  }

  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY ?? '');
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }

  authClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });
  return authClient;
}

function sheetsClient(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuthClient() as OAuth2Client });
}

function driveClient(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getAuthClient() as OAuth2Client });
}

// ---------------------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------------------

async function getNumericSheetId(title: string): Promise<number | undefined> {
  const spreadsheet = await sheetsClient().spreadsheets.get({ spreadsheetId: getServerEnv().GOOGLE_SHEET_ID });
  return spreadsheet.data.sheets?.find((s) => s.properties?.title === title)?.properties?.sheetId ?? undefined;
}

async function ensureSheet(title: string, headers: string[]): Promise<void> {
  if ((await getNumericSheetId(title)) !== undefined) return;
  const spreadsheetId = getServerEnv().GOOGLE_SHEET_ID;
  const sheets = sheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${title}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  });
}

async function deleteSheetRow(title: string, rowNum: number): Promise<void> {
  const sheetId = await getNumericSheetId(title);
  if (sheetId === undefined) throw new Error(`Sheet '${title}' not found`);
  await sheetsClient().spreadsheets.batchUpdate({
    spreadsheetId: getServerEnv().GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        { deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowNum - 1, endIndex: rowNum } } },
      ],
    },
  });
}

/** Writes a row as plain text. RAW (not USER_ENTERED) prevents formula injection like "=IMPORTXML(...)". */
async function writeRow(range: string, values: string[]): Promise<void> {
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: getServerEnv().GOOGLE_SHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
}

async function appendRow(range: string, values: string[]): Promise<void> {
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: getServerEnv().GOOGLE_SHEET_ID,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function fetchJobs(): Promise<Job[]> {
  await ensureSheet(SHEET_NAME, JOB_HEADERS);
  const response = await sheetsClient().spreadsheets.values.get({
    spreadsheetId: getServerEnv().GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:R`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h).trim().replace(/\s+/g, '').toLowerCase());
  return rows
    .slice(1)
    .map((row, idx) => {
      const obj: Record<string, string | number> = {};
      headers.forEach((header, col) => {
        obj[header] = row[col] === undefined || row[col] === null ? '' : String(row[col]).trim();
      });
      obj.otherlink = String(obj.otherlink || obj.linkother || (row[17] ? String(row[17]).trim() : ''));
      obj.rownum = idx + 2; // header is row 1
      return obj as unknown as Job;
    })
    .filter((job) => job.company);
}

export async function findJobById(id: string): Promise<Job | undefined> {
  return (await fetchJobs()).find((job) => job.id === id);
}

export interface SaveJobInput {
  id?: string;
  company: string;
  startDate: string;
  endDate: string;
  status: string;
  linkIg: string;
  linkLi: string;
  linkWeb: string;
  linkOther: string;
  kategori: string;
  note: string;
  buktiurl: string;
  platform: string;
  careerLevel: string;
  currentStage: string;
  province: string;
  city: string;
}

export async function saveJob(input: SaveJobInput): Promise<'Updated' | 'Appended'> {
  const existing = input.id ? await findJobById(input.id) : undefined;
  if (input.id && !existing) throw new JobNotFoundError();

  const row = [
    existing?.id || `ID-${Date.now()}`,
    new Date().toISOString(),
    input.company,
    input.startDate,
    input.endDate,
    input.status,
    input.linkIg,
    input.linkLi,
    input.linkWeb,
    input.kategori,
    input.note,
    input.buktiurl || 'No File',
    input.platform,
    input.careerLevel,
    input.currentStage,
    input.province,
    input.city,
    input.linkOther,
  ];

  if (existing) {
    await writeRow(`${SHEET_NAME}!A${existing.rownum}:R${existing.rownum}`, row);
    return 'Updated';
  }
  await appendRow(`${SHEET_NAME}!A:R`, row);
  return 'Appended';
}

export class JobNotFoundError extends Error {
  constructor() {
    super('Application not found');
  }
}

export async function deleteJobById(id: string): Promise<Job> {
  const job = await findJobById(id);
  if (!job) throw new JobNotFoundError();
  await deleteSheetRow(SHEET_NAME, job.rownum);
  return job;
}

// ---------------------------------------------------------------------------
// Drive
// ---------------------------------------------------------------------------

export function getDriveFileId(url: string): string | null {
  return url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ?? null;
}

/**
 * Trashes a file, but only if it lives in the app's upload folder. URLs come
 * from sheet data, so never trust them to point at a file we own.
 */
export async function trashUploadedFile(fileUrl: string): Promise<void> {
  const fileId = getDriveFileId(fileUrl);
  if (!fileId) return;

  const drive = driveClient();
  try {
    const file = await drive.files.get({ fileId, fields: 'parents', supportsAllDrives: true });
    if (!file.data.parents?.includes(getServerEnv().GOOGLE_DRIVE_FOLDER_ID)) {
      console.warn('[drive] refusing to trash a file outside the upload folder');
      return;
    }
    await drive.files.update({ fileId, supportsAllDrives: true, requestBody: { trashed: true } });
  } catch (error) {
    console.error('[drive] failed to trash file:', error instanceof Error ? error.message : error);
  }
}

/** Uploads into the app folder. Files stay private to the Drive owner (no public link sharing). */
export async function uploadFileToDrive(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const file = await driveClient().files.create({
    requestBody: { name: fileName, parents: [getServerEnv().GOOGLE_DRIVE_FOLDER_ID] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,webViewLink',
    supportsAllDrives: true,
  });
  if (!file.data.id) throw new Error('Drive upload returned no file id');
  return file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`;
}

// ---------------------------------------------------------------------------
// Interview questions
// ---------------------------------------------------------------------------

type InterviewInput = Omit<InterviewQuestion, 'id' | 'rownum'>;

function interviewRow(id: string, q: InterviewInput): string[] {
  return [id, q.category, q.question, q.situation, q.task, q.action, q.result, q.targetcompany, q.difficulty, q.status];
}

export async function fetchInterviewQuestions(): Promise<InterviewQuestion[]> {
  await ensureSheet(INTERVIEWS_SHEET_NAME, INTERVIEW_HEADERS);
  const response = await sheetsClient().spreadsheets.values.get({
    spreadsheetId: getServerEnv().GOOGLE_SHEET_ID,
    range: `${INTERVIEWS_SHEET_NAME}!A2:J`,
  });

  return (response.data.values ?? [])
    .map((row, index) => ({
      id: String(row[0] || ''),
      category: row[1] || 'Behavioral',
      question: row[2] || '',
      situation: row[3] || '',
      task: row[4] || '',
      action: row[5] || '',
      result: row[6] || '',
      targetcompany: row[7] || '',
      difficulty: (['Easy', 'Medium', 'Hard'].includes(row[8]) ? row[8] : 'Medium') as InterviewQuestion['difficulty'],
      status: (row[9] === 'Mastered' ? 'Mastered' : 'Practice Needed') as InterviewQuestion['status'],
      rownum: index + 2,
    }))
    .filter((q) => q.id && q.question.trim() !== '');
}

export async function addInterviewQuestion(data: InterviewInput): Promise<InterviewQuestion> {
  await ensureSheet(INTERVIEWS_SHEET_NAME, INTERVIEW_HEADERS);
  const id = `iq_${Date.now()}`;
  await appendRow(`${INTERVIEWS_SHEET_NAME}!A:J`, interviewRow(id, data));
  return { ...data, id, rownum: 0 };
}

export async function updateInterviewQuestion(id: string, data: Partial<InterviewInput>): Promise<void> {
  const target = (await fetchInterviewQuestions()).find((q) => q.id === id);
  if (!target) throw new InterviewNotFoundError();
  const merged: InterviewInput = { ...target, ...data };
  await writeRow(`${INTERVIEWS_SHEET_NAME}!A${target.rownum}:J${target.rownum}`, interviewRow(id, merged));
}

export async function deleteInterviewQuestion(id: string): Promise<void> {
  const target = (await fetchInterviewQuestions()).find((q) => q.id === id);
  if (!target) throw new InterviewNotFoundError();
  await deleteSheetRow(INTERVIEWS_SHEET_NAME, target.rownum);
}

export class InterviewNotFoundError extends Error {
  constructor() {
    super('Interview question not found');
  }
}
