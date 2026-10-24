import 'server-only';
import type { Difficulty, MasteryStatus } from '@/lib/constants';
import type { InterviewQuestion, InterviewQuestionInput } from '@/lib/types';
import { DbError, must, NotFoundError, owned, type DataContext } from '../db';
import { isUuid } from '../proofs';

interface QuestionRow {
  id: string;
  category: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  target_company: string;
  difficulty: string;
  status: string;
  notes: string;
  practice_count: number;
  last_practiced_at: string | null;
}

const SELECT =
  'id, category, question, situation, task, action, result, target_company, difficulty, status, notes, practice_count, last_practiced_at';

export function toQuestion(row: QuestionRow): InterviewQuestion {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    situation: row.situation,
    task: row.task,
    action: row.action,
    result: row.result,
    targetCompany: row.target_company,
    // The database's check constraints only allow known values.
    difficulty: row.difficulty as Difficulty,
    status: row.status as MasteryStatus,
    notes: row.notes,
    lastPracticedAt: row.last_practiced_at ? new Date(row.last_practiced_at).toISOString() : '',
    practiceCount: row.practice_count,
  };
}

function toRow(input: Partial<InterviewQuestionInput>) {
  const row: Record<string, string> = {};
  const map: [keyof InterviewQuestionInput, string][] = [
    ['category', 'category'],
    ['question', 'question'],
    ['situation', 'situation'],
    ['task', 'task'],
    ['action', 'action'],
    ['result', 'result'],
    ['targetCompany', 'target_company'],
    ['difficulty', 'difficulty'],
    ['status', 'status'],
    ['notes', 'notes'],
  ];
  // Only fields that were sent: a partial update must not reset the others.
  for (const [key, column] of map) if (input[key] !== undefined) row[column] = input[key] as string;
  return row;
}

const notFound = () => new NotFoundError('Interview question not found');

export async function listQuestions(ctx: DataContext): Promise<InterviewQuestion[]> {
  const rows = must(
    await ctx.db.from('interview_questions').select(SELECT).eq('user_id', ctx.userId).order('created_at', { ascending: true })
  ) as QuestionRow[];
  return rows.map(toQuestion);
}

/** Inserts one or more questions in a single request. */
export async function createQuestions(ctx: DataContext, inputs: InterviewQuestionInput[]): Promise<InterviewQuestion[]> {
  const rows = must(
    await ctx.db
      .from('interview_questions')
      .insert(inputs.map((input) => owned(ctx, toRow(input))))
      .select(SELECT)
  ) as QuestionRow[];
  return rows.map(toQuestion);
}

export async function createQuestion(ctx: DataContext, input: InterviewQuestionInput): Promise<InterviewQuestion> {
  const [question] = await createQuestions(ctx, [input]);
  return question;
}

export async function updateQuestion(
  ctx: DataContext,
  id: string,
  changes: Partial<InterviewQuestionInput>
): Promise<InterviewQuestion> {
  if (!isUuid(id)) throw notFound();
  const values = toRow(changes);
  const query = Object.keys(values).length
    ? ctx.db.from('interview_questions').update(values).eq('user_id', ctx.userId).eq('id', id).select(SELECT)
    : ctx.db.from('interview_questions').select(SELECT).eq('user_id', ctx.userId).eq('id', id);
  const row = must(await query.maybeSingle()) as QuestionRow | null;
  if (!row) throw notFound();
  return toQuestion(row);
}

/** One practice round: an atomic increment in the database (record_practice). */
export async function recordPractice(ctx: DataContext, id: string): Promise<InterviewQuestion> {
  if (!isUuid(id)) throw notFound();
  if (ctx.via === 'token') {
    // The RPC relies on auth.uid(), which the secret-key client doesn't have.
    throw new DbError('record_practice needs a user session', '42501');
  }
  const row = must(await ctx.db.rpc('record_practice', { question_id: id })) as QuestionRow | null;
  // The RPC returns a row of nulls when the question isn't the caller's.
  if (!row?.id) throw notFound();
  return toQuestion(row);
}

export async function deleteQuestion(ctx: DataContext, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const deleted = must(
    await ctx.db.from('interview_questions').delete().eq('user_id', ctx.userId).eq('id', id).select('id')
  );
  if (deleted.length === 0) throw notFound();
}
