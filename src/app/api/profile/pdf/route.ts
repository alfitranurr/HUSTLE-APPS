import { HttpError, ok, withAuth } from '@/lib/server/http';
import { parseProfilePdf } from '@/lib/server/linkedin/profilePdf';
import { getProfile, saveProfile } from '@/lib/server/repositories/profile';
import { validateUploads } from '@/lib/server/uploads';

/**
 * Reads LinkedIn's "Save to PDF" export. Parsed fields replace the old ones;
 * the owner's own choices (target roles, locations, keywords) are kept.
 */
export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'Choose your LinkedIn profile PDF.');
  const [upload] = await validateUploads([file]);
  if (!upload || upload.mimeType !== 'application/pdf') throw new HttpError(415, 'The profile must be a PDF.');

  let parsed;
  try {
    parsed = await parseProfilePdf(new Uint8Array(upload.buffer));
  } catch {
    throw new HttpError(422, 'Could not read this PDF. Use LinkedIn → More → Save to PDF on your profile.');
  }

  const current = await getProfile();
  const keepOwn = <T,>(own: T[] | undefined, fallback: T[]) => (own && own.length > 0 ? own : fallback);
  return ok(
    await saveProfile(
      {
        ...parsed,
        skills: [...new Set([...parsed.skills, ...(current?.skills ?? [])])],
        targetRoles: keepOwn(current?.targetRoles, parsed.targetRoles),
        preferredLocations: keepOwn(current?.preferredLocations, parsed.preferredLocations),
        keywords: current?.keywords ?? [],
        excludeKeywords: current?.excludeKeywords ?? [],
      },
      new Date().toISOString()
    )
  );
});
