import 'server-only';
import { trashUploadedFile, uploadFileToDrive, type Job, type SaveJobInput } from '@/lib/googleSheets';
import { getProofUrls } from '@/lib/utils';
import { jobFormSchema } from '@/lib/validation';
import { validateUploads } from './uploads';

const FIELDS = Object.keys(jobFormSchema.shape) as (keyof typeof jobFormSchema.shape)[];

/**
 * Parses the multipart job form, uploads new attachments and works out which
 * existing attachments to keep. Only URLs already stored on the job can be
 * kept, so the client can't inject or delete arbitrary Drive files.
 */
export async function buildJobFromForm(
  formData: FormData,
  existing?: Job
): Promise<{ input: Omit<SaveJobInput, 'id'>; removedUrls: string[] }> {
  const raw: Record<string, string | undefined> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    raw[field] = typeof value === 'string' ? value : undefined;
  }
  const fields = jobFormSchema.parse(raw);

  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  const uploads = await validateUploads(files);

  const storedUrls = getProofUrls(existing?.buktiurl);
  const requestedKeep = new Set(formData.getAll('keepUrls').map(String));
  const keptUrls = storedUrls.filter((url) => requestedKeep.has(url));
  const removedUrls = storedUrls.filter((url) => !requestedKeep.has(url));

  const uploadedUrls: string[] = [];
  for (const upload of uploads) {
    uploadedUrls.push(await uploadFileToDrive(upload.buffer, upload.name, upload.mimeType));
  }

  const allUrls = [...keptUrls, ...uploadedUrls];
  return {
    input: { ...fields, buktiurl: allUrls.length > 0 ? allUrls.join(', ') : 'No File' },
    removedUrls,
  };
}

export async function trashFiles(urls: string[]) {
  await Promise.all(urls.filter((u) => u.includes('drive.google.com')).map(trashUploadedFile));
}
