import 'server-only';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CAREER_LEVELS, JOB_STAGES, JOB_STATUSES, PLATFORMS } from '@/lib/constants';
import { parseDate } from '@/lib/format';
import type { Job } from '@/lib/types';
import { jobFieldsSchema } from '@/lib/validation';
import { DbError, type DataContext } from '../db';
import { createJob, listJobs, patchJob, type JobPatch } from '../repositories/jobs';

/**
 * Hustle's own MCP server (Streamable HTTP at /api/mcp), the remote version
 * of hustle-mcp: same tools, run directly on the repositories with the access
 * key's DataContext. A remote server can't read files on the user's computer,
 * so proof files are added through a link to the application's form.
 */

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const time = (j: Job) => parseDate(j.appliedAt)?.getTime() ?? 0;

/** Database messages can name tables and policies: never pass them to the agent. */
async function safely<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof DbError) {
      console.error(`[mcp] database error ${error.code}:`, error.message);
      throw new Error('Hustle could not save that. Please try again.');
    }
    throw error;
  }
}

export function createHustleMcpServer(ctx: DataContext, baseUrl: string): McpServer {
  const server = new McpServer({ name: 'hustle', version: '2.0.0' });
  const editLink = (id: string) => `${baseUrl}/tracker?edit=${id}`;
  const brief = (j: Job) => ({
    id: j.id,
    company: j.company,
    position: j.position,
    status: j.status,
    stage: j.stage,
    appliedAt: j.appliedAt,
    platform: j.platform,
    proofFiles: j.attachments.map((a) => a.name),
    link: editLink(j.id),
  });

  server.registerTool(
    'hustle_list_applications',
    {
      title: 'List job applications',
      description:
        'List the user\'s applications in Hustle, newest first, optionally filtered by text in company or position. ' +
        'Use it before adding one, to avoid duplicates, and to find an id.',
      inputSchema: {
        query: z.string().max(200).optional().describe('Case-insensitive text matched against company and position'),
        limit: z.number().int().min(1).max(200).default(20),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit }) =>
      safely(async () => {
        const jobs = await listJobs(ctx);
        const q = normalize(query ?? '');
        const rows = jobs
          .filter((j) => !q || normalize(j.company).includes(q) || normalize(j.position).includes(q))
          .sort((a, b) => time(b) - time(a))
          .slice(0, limit)
          .map(brief);
        return json({ total: jobs.length, matched: rows.length, applications: rows });
      })
  );

  server.registerTool(
    'hustle_add_application',
    {
      title: 'Add a job application',
      description:
        'Add a job application. Dry run by default: show the result to the user and call again with dryRun=false only ' +
        'after they confirm. Refuses a duplicate (same company + position) unless allowDuplicate=true. Proof files ' +
        '(a screenshot or PDF) can\'t be sent through this connection: give the user the returned link to add them.',
      inputSchema: {
        company: z.string().min(1).max(200),
        position: z.string().max(200).default(''),
        platform: z.enum(PLATFORMS).describe('Where the application was sent (not where the job was found)'),
        careerLevel: z.enum(CAREER_LEVELS).optional(),
        province: z.string().max(120).default(''),
        city: z.string().max(120).default(''),
        status: z.enum(JOB_STATUSES).default('In Progress'),
        stage: z.enum(JOB_STAGES).default('Document Screening'),
        appliedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'use yyyy-mm-ddTHH:mm (Jakarta time)'),
        note: z.string().max(5000).default(''),
        instagram: z.string().max(500).default(''),
        linkedin: z.string().max(500).default(''),
        website: z.string().max(500).default(''),
        otherLink: z.string().max(500).default(''),
        dryRun: z.boolean().default(true).describe('true = validate and show what would be saved, without saving'),
        allowDuplicate: z.boolean().default(false),
      },
    },
    async (a) =>
      safely(async () => {
        const stageDates = a.stage === 'Not Started' ? {} : { [a.stage]: a.appliedAt.slice(0, 10) };
        // The web form's own validation (links normalised, dates checked).
        const { instagram, linkedin, website, otherLink, ...fields } = jobFieldsSchema.parse({
          company: a.company,
          position: a.position,
          appliedAt: a.appliedAt,
          scheduledAt: '',
          contractDate: '',
          stageDates: JSON.stringify(stageDates),
          status: a.status,
          stage: a.stage,
          platform: a.platform,
          careerLevel: a.careerLevel ?? '',
          province: a.province,
          city: a.city,
          note: a.note,
          instagram: a.instagram,
          linkedin: a.linkedin,
          website: a.website,
          otherLink: a.otherLink,
        });
        const data = { ...fields, links: { instagram, linkedin, website, other: otherLink } };

        const duplicates = (await listJobs(ctx)).filter(
          (j) => normalize(j.company) === normalize(a.company) && normalize(j.position) === normalize(a.position)
        );
        if (duplicates.length && !a.allowDuplicate) {
          return json({ saved: false, reason: 'An application with this company and position already exists.', existing: duplicates.map(brief) });
        }
        if (a.dryRun) return json({ saved: false, dryRun: true, wouldSave: data });

        const job = await createJob(ctx, data, []);
        return json({
          saved: true,
          application: brief(job),
          addProof: `To attach a screenshot or PDF as proof, open ${editLink(job.id)} and add it under "Proof of application".`,
        });
      })
  );

  server.registerTool(
    'hustle_update_application',
    {
      title: 'Update stage or status',
      description:
        'Change the stage and/or status of an application, or mark a follow-up (bumps "last updated"). ' +
        'Reaching "Contract Signed / Done" sets status Success unless a status is given.',
      inputSchema: {
        id: z.string().min(1).max(100),
        stage: z.enum(JOB_STAGES).optional(),
        status: z.enum(JOB_STATUSES).optional(),
        followedUp: z.boolean().optional(),
      },
    },
    async ({ id, stage, status, followedUp }) =>
      safely(async () => {
        if (!stage && !status && !followedUp) throw new Error('Nothing to update: give stage, status or followedUp.');
        const patch: JobPatch = {};
        if (stage) patch.stage = stage;
        if (status) patch.status = status;
        if (stage === 'Contract Signed / Done' && !status) patch.status = 'Success';
        return json({ updated: true, application: brief(await patchJob(ctx, id, patch)) });
      })
  );

  server.registerTool(
    'hustle_proof_link',
    {
      title: 'Link for adding proof files',
      description:
        'Proof files (screenshot or PDF of an application) can\'t be uploaded through this connection, because it can\'t ' +
        'read files on the user\'s computer. This returns the link that opens the application in Hustle, where the user adds them.',
      inputSchema: { id: z.string().min(1).max(100) },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      safely(async () => {
        const job = (await listJobs(ctx)).find((j) => j.id === id);
        if (!job) throw new Error(`No application with id ${id}. Use hustle_list_applications to find it.`);
        return json({
          application: brief(job),
          link: editLink(job.id),
          instructions: 'Open the link, then add the file under "Proof of application" and save.',
        });
      })
  );

  return server;
}
