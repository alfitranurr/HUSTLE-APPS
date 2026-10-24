import 'server-only';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CAREER_LEVELS, JOB_STAGES, JOB_STATUSES, PLATFORMS } from '@/lib/constants';
import { parseDate } from '@/lib/format';
import { parseNote, serialiseNote } from '@/lib/notes';
import type { Job } from '@/lib/types';
import { jobFieldsSchema } from '@/lib/validation';
import { DbError, type DataContext } from '../db';
import type { JobData } from '../repositories/jobMapper';
import { createJob, deleteJob, getJob, listJobs, patchJob, updateJob, type JobPatch } from '../repositories/jobs';

/**
 * Hustle's own MCP server (Streamable HTTP at /api/mcp): full create / read /
 * update / delete of the user's applications with every field of the form,
 * run directly on the repositories with the access key's DataContext.
 *
 * One thing it can't do: upload proof files. A remote server can't read files
 * on the user's computer, so new proof goes through a link to the form;
 * existing proof files can be listed and removed here.
 */

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const time = (j: Job) => parseDate(j.appliedAt)?.getTime() ?? 0;

/** Database messages can name tables and policies: never pass them to the agent. */
async function safely<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      throw new Error(first ? `${first.path.join('.') || 'input'}: ${first.message}` : 'Invalid input');
    }
    if (error instanceof DbError) {
      console.error(`[mcp] database error ${error.code}:`, error.message);
      throw new Error('Hustle could not save that. Please try again.');
    }
    throw error;
  }
}

// --- the form's fields, as tool inputs ----------------------------------------------

const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const notePoint = z.object({
  label: z.string().max(40).optional().describe('Short label, e.g. "Found on", "Salary", "Recruiter", "Next step"'),
  text: z.string().max(1000),
});

/** Every editable field of the application form. All optional here; "add" requires a few. */
const formFields = {
  company: z.string().min(1).max(200).optional(),
  position: z.string().max(200).optional(),
  platform: z.enum(PLATFORMS).optional().describe('Where the application was sent (not where the job was found)'),
  careerLevel: z.enum(CAREER_LEVELS).optional(),
  province: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  status: z.enum(JOB_STATUSES).optional(),
  stage: z.enum(JOB_STAGES).optional(),
  appliedAt: z.string().regex(DATETIME, 'use yyyy-mm-ddTHH:mm (Jakarta time)').optional(),
  scheduledAt: z
    .string()
    .regex(DATETIME, 'use yyyy-mm-ddTHH:mm (Jakarta time)')
    .or(z.literal(''))
    .optional()
    .describe('Date/time of the upcoming test or interview; "" clears it'),
  contractDate: z.string().regex(DATE, 'use yyyy-mm-dd').or(z.literal('')).optional().describe('Offer/contract start date; "" clears it'),
  stageDates: z
    .partialRecord(z.enum(JOB_STAGES), z.string().regex(DATE, 'use yyyy-mm-dd'))
    .optional()
    .describe('Date each stage was reached, e.g. {"Document Screening":"2026-10-20","HR Interview":"2026-10-27"}. Only stages actually gone through; replaces the existing dates'),
  notes: z
    .array(notePoint)
    .max(50)
    .optional()
    .describe('The note as points, one per line in Hustle ("Label: text"). Replaces the whole note; [] clears it'),
  linkedin: z.string().max(500).optional(),
  website: z.string().max(500).optional().describe('Website or job post link'),
  instagram: z.string().max(500).optional(),
  otherLink: z.string().max(500).optional(),
};

type FormInput = { [K in keyof typeof formFields]?: z.infer<(typeof formFields)[K]> };

/**
 * Merges the given fields over an existing job (or empty defaults) and runs the
 * web form's own validation, so links are normalised and dates checked the same way.
 */
function toJobData(input: FormInput, base?: Job): JobData {
  const stage = input.stage ?? base?.stage ?? 'Document Screening';
  const appliedAt = input.appliedAt ?? base?.appliedAt ?? '';
  const stageDates =
    input.stageDates ?? base?.stageDates ?? (stage === 'Not Started' || !appliedAt ? {} : { [stage]: appliedAt.slice(0, 10) });
  const { instagram, linkedin, website, otherLink, ...fields } = jobFieldsSchema.parse({
    company: input.company ?? base?.company,
    position: input.position ?? base?.position ?? '',
    appliedAt,
    scheduledAt: input.scheduledAt ?? base?.scheduledAt ?? '',
    contractDate: input.contractDate ?? base?.contractDate ?? '',
    stageDates: JSON.stringify(stageDates),
    status: input.status ?? base?.status ?? 'In Progress',
    stage,
    platform: input.platform ?? base?.platform,
    careerLevel: input.careerLevel ?? base?.careerLevel ?? '',
    province: input.province ?? base?.province ?? '',
    city: input.city ?? base?.city ?? '',
    note: input.notes ? serialiseNote(input.notes) : (base?.note ?? ''),
    instagram: input.instagram ?? base?.links.instagram ?? '',
    linkedin: input.linkedin ?? base?.links.linkedin ?? '',
    website: input.website ?? base?.links.website ?? '',
    otherLink: input.otherLink ?? base?.links.other ?? '',
  });
  return { ...fields, links: { instagram, linkedin, website, other: otherLink } };
}

export function createHustleMcpServer(ctx: DataContext, baseUrl: string): McpServer {
  const server = new McpServer({ name: 'hustle', version: '3.0.0' });
  const editLink = (id: string) => `${baseUrl}/tracker?edit=${id}`;

  const brief = (j: Job) => ({
    id: j.id,
    company: j.company,
    position: j.position,
    status: j.status,
    stage: j.stage,
    appliedAt: j.appliedAt,
    platform: j.platform,
    proofFiles: j.attachments.length,
    link: editLink(j.id),
  });

  const detail = (j: Job) => ({
    id: j.id,
    company: j.company,
    position: j.position,
    platform: j.platform,
    careerLevel: j.careerLevel,
    province: j.province,
    city: j.city,
    status: j.status,
    stage: j.stage,
    appliedAt: j.appliedAt,
    scheduledAt: j.scheduledAt,
    contractDate: j.contractDate,
    stageDates: j.stageDates,
    notes: parseNote(j.note),
    linkedin: j.links.linkedin,
    website: j.links.website,
    instagram: j.links.instagram,
    otherLink: j.links.other,
    proofFiles: j.attachments.map((a) => ({ id: a.id, name: a.name })),
    lastUpdated: j.updatedAt,
    link: editLink(j.id),
  });

  // --- read -------------------------------------------------------------------------

  server.registerTool(
    'hustle_list_applications',
    {
      title: 'List job applications',
      description:
        "List the user's applications in Hustle, newest first, optionally filtered by text, status or stage. " +
        'Use it before adding one (to avoid duplicates) and to find an id.',
      inputSchema: {
        query: z.string().max(200).optional().describe('Case-insensitive text matched against company and position'),
        status: z.enum(JOB_STATUSES).optional(),
        stage: z.enum(JOB_STAGES).optional(),
        limit: z.number().int().min(1).max(250).default(20),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, status, stage, limit }) =>
      safely(async () => {
        const jobs = await listJobs(ctx);
        const q = normalize(query ?? '');
        const rows = jobs
          .filter((j) => !q || normalize(j.company).includes(q) || normalize(j.position).includes(q))
          .filter((j) => (!status || j.status === status) && (!stage || j.stage === stage))
          .sort((a, b) => time(b) - time(a));
        return json({ total: jobs.length, matched: rows.length, applications: rows.slice(0, limit).map(brief) });
      })
  );

  server.registerTool(
    'hustle_get_application',
    {
      title: 'Get one application',
      description: 'Every field of one application, as in the form: links, dates, stage dates, notes as points, proof files.',
      inputSchema: { id: z.string().min(1).max(100) },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => safely(async () => json(detail(await getJob(ctx, id))))
  );

  // --- create -----------------------------------------------------------------------

  server.registerTool(
    'hustle_add_application',
    {
      title: 'Add a job application',
      description:
        'Add an application with any fields of the form. Dry run by default: show the result to the user and call again ' +
        'with dryRun=false only after they confirm. Refuses a duplicate (same company + position) unless allowDuplicate=true. ' +
        "Proof files can't be uploaded through this connection: give the user the returned link to add them.",
      inputSchema: {
        ...formFields,
        company: z.string().min(1).max(200),
        platform: z.enum(PLATFORMS).describe('Where the application was sent (not where the job was found)'),
        appliedAt: z.string().regex(DATETIME, 'use yyyy-mm-ddTHH:mm (Jakarta time)'),
        dryRun: z.boolean().default(true).describe('true = validate and show what would be saved, without saving'),
        allowDuplicate: z.boolean().default(false),
      },
    },
    async ({ dryRun, allowDuplicate, ...input }) =>
      safely(async () => {
        const data = toJobData(input);
        const duplicates = (await listJobs(ctx)).filter(
          (j) => normalize(j.company) === normalize(data.company) && normalize(j.position) === normalize(data.position)
        );
        if (duplicates.length && !allowDuplicate) {
          return json({ saved: false, reason: 'An application with this company and position already exists.', existing: duplicates.map(brief) });
        }
        if (dryRun) return json({ saved: false, dryRun: true, wouldSave: { ...data, notes: parseNote(data.note) } });
        const job = await createJob(ctx, data, []);
        return json({
          saved: true,
          application: detail(job),
          addProof: `To attach a screenshot or PDF as proof, open ${editLink(job.id)} and add it under "Proof of application".`,
        });
      })
  );

  // --- update -----------------------------------------------------------------------

  server.registerTool(
    'hustle_update_application',
    {
      title: 'Edit an application',
      description:
        'Change any fields of an application (only the ones given change), remove proof files, or mark a follow-up ' +
        '(bumps "last updated"). Reaching "Contract Signed / Done" sets status Success unless a status is given. ' +
        'Moving to a new stage dates it today unless stageDates says otherwise. Tell the user what will change before ' +
        'bigger edits; use dryRun=true to preview.',
      inputSchema: {
        id: z.string().min(1).max(100),
        ...formFields,
        removeProofFileIds: z.array(z.string()).max(5).optional().describe('Ids from hustle_get_application → proofFiles'),
        followedUp: z.boolean().optional().describe('Mark a follow-up without changing anything else'),
        dryRun: z.boolean().default(false),
      },
    },
    async ({ id, removeProofFileIds, followedUp, dryRun, ...input }) =>
      safely(async () => {
        const before = await getJob(ctx, id);
        const changedFields = Object.keys(input).filter((k) => input[k as keyof FormInput] !== undefined);
        const removing = before.attachments.filter((a) => removeProofFileIds?.includes(a.id));
        if (removeProofFileIds?.length && removing.length !== removeProofFileIds.length) {
          throw new Error('Some proof file ids are not on this application. Use hustle_get_application to see them.');
        }
        if (!changedFields.length && !removing.length && !followedUp) {
          throw new Error('Nothing to change: give at least one field, removeProofFileIds or followedUp.');
        }

        // Stage/status only (the board's quick change): same path as the app, stage dated automatically.
        const quick = changedFields.every((k) => k === 'stage' || k === 'status') && !removing.length;
        if (input.stage === 'Contract Signed / Done' && !input.status) input.status = 'Success';
        if (dryRun) {
          return json({
            saved: false,
            dryRun: true,
            changes: Object.fromEntries(changedFields.map((k) => [k, input[k as keyof FormInput]])),
            removeProofFiles: removing.map((a) => a.name),
            followedUp: Boolean(followedUp),
          });
        }

        let after: Job;
        if (quick) {
          const patch: JobPatch = {};
          if (input.stage) patch.stage = input.stage;
          if (input.status) patch.status = input.status;
          after = await patchJob(ctx, id, patch);
        } else {
          const keep = before.attachments.filter((a) => !removing.includes(a)).map((a) => a.id);
          after = (await updateJob(ctx, id, toJobData(input, before), { keepAttachmentIds: keep, uploads: [] })).after;
        }
        return json({ saved: true, changed: changedFields, removedProofFiles: removing.map((a) => a.name), application: detail(after) });
      })
  );

  // --- delete -----------------------------------------------------------------------

  server.registerTool(
    'hustle_delete_application',
    {
      title: 'Delete an application',
      description:
        'Delete an application and its proof files for good. Without confirm=true it only shows what would be deleted: ' +
        'show that to the user and call again with confirm=true only after they agree.',
      inputSchema: { id: z.string().min(1).max(100), confirm: z.boolean().default(false) },
      annotations: { destructiveHint: true },
    },
    async ({ id, confirm }) =>
      safely(async () => {
        const job = await getJob(ctx, id);
        if (!confirm) {
          return json({ deleted: false, wouldDelete: brief(job), proofFiles: job.attachments.map((a) => a.name) });
        }
        await deleteJob(ctx, id);
        return json({ deleted: true, application: { company: job.company, position: job.position } });
      })
  );

  // --- proof files ------------------------------------------------------------------

  server.registerTool(
    'hustle_proof_link',
    {
      title: 'Link for adding proof files',
      description:
        "Proof files (screenshot or PDF of an application) can't be uploaded through this connection, because it can't " +
        "read files on the user's computer. This returns the link that opens the application in Hustle, where the user adds them.",
      inputSchema: { id: z.string().min(1).max(100) },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      safely(async () => {
        const job = await getJob(ctx, id);
        return json({
          application: brief(job),
          link: editLink(job.id),
          instructions: 'Open the link, then add the file under "Proof of application" and save.',
        });
      })
  );

  return server;
}
