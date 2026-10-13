import 'server-only';
import type { Job } from '@/lib/types';
import { jobFieldsSchema } from '@/lib/validation';
import { uploadFile } from './google/drive';
import type { JobData } from './repositories/jobs';
import { validateUploads } from './uploads';

const FIELDS = Object.keys(jobFieldsSchema.shape) as (keyof typeof jobFieldsSchema.shape)[];

/**
 * Turns the multipart job form into repository data: validates fields, uploads
 * new attachments and decides which existing attachments to keep. Only URLs
 * already stored on the job can be kept, so a client can never inject or
 * delete arbitrary Drive files.
 */
export async function parseJobForm(
  formData: FormData,
  existing?: Job
): Promise<{ data: JobData; removedAttachments: string[] }> {
  const raw: Record<string, string | undefined> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    raw[field] = typeof value === 'string' ? value : undefined;
  }
  const { instagram, linkedin, website, otherLink, ...fields } = jobFieldsSchema.parse(raw);

  // Validate every file before uploading any of them.
  const uploads = await validateUploads(formData.getAll('files').filter((f): f is File => f instanceof File));

  const keep = new Set(formData.getAll('keepAttachments').map(String));
  const stored = existing?.attachments ?? [];
  const kept = stored.filter((url) => keep.has(url));
  const removedAttachments = stored.filter((url) => !keep.has(url));

  const uploaded: string[] = [];
  for (const file of uploads) uploaded.push(await uploadFile(file.buffer, file.name, file.mimeType));

  return {
    data: {
      ...fields,
      links: { instagram, linkedin, website, other: otherLink },
      attachments: [...kept, ...uploaded],
    },
    removedAttachments,
  };
}
