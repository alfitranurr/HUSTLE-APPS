import { parseRecommendationEmail } from '@/lib/linkedin/parseJobs';
import { fetchRecommendationEmails, GmailNotConfiguredError } from '@/lib/server/google/gmail';
import { HttpError, ok, withAuth } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { addRecommendations, GMAIL_SYNC_KEY } from '@/lib/server/repositories/recommendations';
import { setSetting } from '@/lib/server/repositories/settings';

/** Pulls LinkedIn recommendation emails from Gmail and stores jobs not seen before. */
export const POST = withAuth(async () => {
  const limit = rateLimit('gmail-sync', 6, 60_000);
  if (!limit.allowed) throw new HttpError(429, `Please wait ${limit.retryAfterSeconds}s before syncing again.`);

  let emails;
  try {
    emails = await fetchRecommendationEmails();
  } catch (error) {
    if (error instanceof GmailNotConfiguredError) {
      throw new HttpError(409, 'Gmail access is not set up yet. Follow the setup steps on this page.');
    }
    throw error;
  }

  const result = await addRecommendations(
    emails.map((email) => ({ jobs: parseRecommendationEmail(email), source: 'email' as const, receivedAt: email.receivedAt }))
  );
  const syncedAt = new Date().toISOString();
  await setSetting(GMAIL_SYNC_KEY, syncedAt);
  return ok({ emails: emails.length, ...result, syncedAt });
});
