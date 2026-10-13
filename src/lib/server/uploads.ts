import 'server-only';
import { MAX_UPLOAD_FILE_MB, MAX_UPLOAD_FILES } from '@/lib/constants';
import { HttpError } from './http';

/** Vercel caps request bodies at 4.5 MB, so keep uploads comfortably below it. */
const MAX_FILES = MAX_UPLOAD_FILES;
const MAX_FILE_BYTES = MAX_UPLOAD_FILE_MB * 1024 * 1024;
const MAX_TOTAL_BYTES = 4.4 * 1024 * 1024;

const SIGNATURES: { mime: string; ext: string[]; matches: (b: Buffer) => boolean }[] = [
  { mime: 'application/pdf', ext: ['pdf'], matches: (b) => b.subarray(0, 4).toString('latin1') === '%PDF' },
  {
    mime: 'image/png',
    ext: ['png'],
    matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  { mime: 'image/jpeg', ext: ['jpg', 'jpeg'], matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/webp',
    ext: ['webp'],
    matches: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

export interface ValidatedUpload {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Checks count, size, extension and the file's magic bytes. The browser-provided
 * MIME type is ignored; we derive it from the content.
 */
export async function validateUploads(files: File[]): Promise<ValidatedUpload[]> {
  const real = files.filter((f) => f.size > 0);
  if (real.length > MAX_FILES) throw new HttpError(400, `You can attach up to ${MAX_FILES} files at a time.`);

  const total = real.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_BYTES) throw new HttpError(413, 'Attachments are too large in total (max 4 MB).');

  const result: ValidatedUpload[] = [];
  for (const file of real) {
    if (file.size > MAX_FILE_BYTES) throw new HttpError(413, `"${file.name}" is larger than 4 MB.`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const signature = SIGNATURES.find((s) => s.ext.includes(ext) && s.matches(buffer));
    if (!signature) throw new HttpError(415, `"${file.name}" must be a PDF, PNG, JPG or WebP file.`);

    const safeName = file.name.replace(/[^\w.\- ()]/g, '_').slice(0, 120);
    result.push({ name: safeName, mimeType: signature.mime, buffer });
  }
  return result;
}
