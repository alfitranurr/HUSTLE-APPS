import { parsePastedJobs } from '@/lib/linkedin/parseJobs';
import { HttpError, ok, withAuth } from '@/lib/server/http';
import { addRecommendations } from '@/lib/server/repositories/recommendations';
import { pasteJobsSchema } from '@/lib/validation';

/** Text copied from LinkedIn's "Top job picks for you" page. */
export const POST = withAuth(async (req, _ctx, data) => {
  const { text } = pasteJobsSchema.parse(await req.json());
  const jobs = parsePastedJobs(text);
  if (jobs.length === 0) throw new HttpError(422, 'No job cards found. Copy the whole "Top job picks for you" page.');
  return ok(await addRecommendations(data, [{ jobs, source: 'paste', receivedAt: new Date().toISOString() }]));
});
