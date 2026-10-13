import 'server-only';
import { Readable } from 'node:stream';
import { getServerEnv } from '@/lib/env';
import { drive } from './client';

export function driveFileId(url: string): string | null {
  return url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ?? null;
}

/** Uploads into the app folder. Files stay private to the Drive owner (no public sharing). */
export async function uploadFile(buffer: Buffer, name: string, mimeType: string): Promise<string> {
  const res = await drive().files.create({
    requestBody: { name, parents: [getServerEnv().GOOGLE_DRIVE_FOLDER_ID] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,webViewLink',
    supportsAllDrives: true,
  });
  if (!res.data.id) throw new Error('Drive upload returned no file id');
  return res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`;
}

/**
 * Moves a file to the Drive trash, but only if it sits in the app's upload
 * folder. URLs come from sheet data and must never be trusted blindly.
 */
export async function trashFile(url: string): Promise<void> {
  const fileId = driveFileId(url);
  if (!fileId) return;
  try {
    const file = await drive().files.get({ fileId, fields: 'parents', supportsAllDrives: true });
    if (!file.data.parents?.includes(getServerEnv().GOOGLE_DRIVE_FOLDER_ID)) {
      console.warn('[drive] refusing to trash a file outside the upload folder');
      return;
    }
    await drive().files.update({ fileId, supportsAllDrives: true, requestBody: { trashed: true } });
  } catch (error) {
    // Cleanup is best effort; the sheet change already succeeded.
    console.error('[drive] failed to trash file:', error instanceof Error ? error.message : error);
  }
}

export async function trashFiles(urls: string[]): Promise<void> {
  await Promise.all(urls.filter((u) => u.includes('drive.google.com')).map(trashFile));
}
