import 'server-only';
import { DIFFICULTIES, INTERVIEW_CATEGORIES, type Difficulty } from '@/lib/constants';
import type { InterviewQuestion, InterviewQuestionInput } from '@/lib/types';
import { appendRow, deleteRow, ensureSheet, NotFoundError, readValues, writeValues } from '../google/sheet';

const SHEET = 'Interviews';
const COLUMNS = [
  'ID', 'Category', 'Question', 'Situation', 'Task', 'Action', 'Result', 'TargetCompany', 'Difficulty', 'Status',
] as const;

function toQuestion(cells: string[]): InterviewQuestion {
  const [id, category, question, situation, task, action, result, targetCompany, difficulty, status] = cells;
  return {
    id: id ?? '',
    category: (INTERVIEW_CATEGORIES as readonly string[]).includes(category) ? category : 'HR / General',
    question: question ?? '',
    situation: situation ?? '',
    task: task ?? '',
    action: action ?? '',
    result: result ?? '',
    targetCompany: targetCompany ?? '',
    difficulty: DIFFICULTIES.includes(difficulty as Difficulty) ? (difficulty as Difficulty) : 'Medium',
    status: status === 'Mastered' ? 'Mastered' : 'Practice Needed',
  };
}

function toCells(q: InterviewQuestion): string[] {
  return [q.id, q.category, q.question, q.situation, q.task, q.action, q.result, q.targetCompany, q.difficulty, q.status];
}

async function readAll() {
  await ensureSheet(SHEET, COLUMNS);
  return (await readValues(`${SHEET}!A2:J`))
    .map((cells, i) => ({ question: toQuestion(cells), row: i + 2 }))
    .filter(({ question }) => question.id && question.question);
}

async function find(id: string) {
  const found = (await readAll()).find((entry) => entry.question.id === id);
  if (!found) throw new NotFoundError('Interview question not found');
  return found;
}

export async function listQuestions(): Promise<InterviewQuestion[]> {
  return (await readAll()).map(({ question }) => question);
}

export async function createQuestion(input: InterviewQuestionInput): Promise<InterviewQuestion> {
  await ensureSheet(SHEET, COLUMNS);
  const question = { ...input, id: `iq_${Date.now()}` };
  await appendRow(`${SHEET}!A:J`, toCells(question));
  return question;
}

export async function updateQuestion(id: string, changes: Partial<InterviewQuestionInput>): Promise<InterviewQuestion> {
  const { question, row } = await find(id);
  const updated = { ...question, ...changes, id };
  await writeValues(`${SHEET}!A${row}:J${row}`, [toCells(updated)]);
  return updated;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { row } = await find(id);
  await deleteRow(SHEET, row);
}
