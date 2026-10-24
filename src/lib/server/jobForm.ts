import 'server-only';
import { jobFieldsSchema } from '@/lib/validation';
import type { JobData } from './repositories/jobs';
import { validateUploads, type ValidatedUpload } from './uploads';

const FIELDS = Object.keys(jobFieldsSchema.shape) as (keyof typeof jobFieldsSchema.shape)[];

/**
 * Turns the multipart job form into repository input: validated fields, the
 * new files (checked, not yet uploaded) and the ids of saved files to keep.
 * The repository only keeps ids that already belong to the job, so a client
 * can never point at someone else's file.
 */
export async function parseJobForm(
  formData: FormData
): Promise<{ data: JobData; uploads: ValidatedUpload[]; keepAttachmentIds: string[] }> {
  const raw: Record<string, string | undefined> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    raw[field] = typeof value === 'string' ? value : undefined;
  }
  const { instagram, linkedin, website, otherLink, ...fields } = jobFieldsSchema.parse(raw);

  // Validate every file before uploading any of them.
  const uploads = await validateUploads(formData.getAll('files').filter((f): f is File => f instanceof File));

  return {
    data: { ...fields, links: { instagram, linkedin, website, other: otherLink } },
    uploads,
    keepAttachmentIds: formData.getAll('keepAttachments').map(String),
  };
}
