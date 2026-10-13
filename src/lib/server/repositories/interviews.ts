import 'server-only';
import { DIFFICULTIES, INTERVIEW_CATEGORIES, type Difficulty } from '@/lib/constants';
import type { InterviewQuestion, InterviewQuestionInput } from '@/lib/types';
import {
  appendRows,
  columnLetter,
  deleteRow,
  ensureSheet,
  NotFoundError,
  readValues,
  writeValues,
} from '../google/sheet';

const SHEET = 'Interviews';
const COLUMNS = [
  'ID', 'Category', 'Question', 'Situation', 'Task', 'Action', 'Result', 'TargetCompany', 'Difficulty', 'Status', 'Notes',
  'LastPracticed', 'PracticeCount',
] as const;
const LAST = columnLetter(COLUMNS.length);

function toQuestion(cells: string[]): InterviewQuestion {
  const [id, category, question, situation, task, action, result, targetCompany, difficulty, status, notes, lastPracticedAt, practiceCount] =
    cells;
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
    notes: notes ?? '',
    lastPracticedAt: lastPracticedAt ?? '',
    practiceCount: Math.max(0, Number.parseInt(practiceCount ?? '', 10) || 0),
  };
}

function toCells(q: InterviewQuestion): string[] {
  return [
    q.id, q.category, q.question, q.situation, q.task, q.action, q.result, q.targetCompany, q.difficulty, q.status, q.notes,
    q.lastPracticedAt, String(q.practiceCount),
  ];
}

let headerChecked = false;

async function readAll() {
  await ensureSheet(SHEET, COLUMNS);
  const [header = [], ...rows] = await readValues(`${SHEET}!A1:${LAST}`);
  // Columns added after the original layout (Notes, practice tracking) get their header once.
  if (!headerChecked) {
    headerChecked = true;
    const missing = COLUMNS.map((name, i) => ({ name, i })).filter(({ i }) => !header[i]);
    for (const { name, i } of missing) await writeValues(`${SHEET}!${columnLetter(i + 1)}1`, [[name]]);
  }
  return rows
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

/** Appends one or more questions in a single request. */
export async function createQuestions(inputs: InterviewQuestionInput[]): Promise<InterviewQuestion[]> {
  await ensureSheet(SHEET, COLUMNS);
  const stamp = Date.now();
  const questions = inputs.map((input, i) => ({
    ...input,
    id: inputs.length === 1 ? `iq_${stamp}` : `iq_${stamp}_${i}`,
    lastPracticedAt: '',
    practiceCount: 0,
  }));
  await appendRows(`${SHEET}!A:${LAST}`, questions.map(toCells));
  return questions;
}

export async function createQuestion(input: InterviewQuestionInput): Promise<InterviewQuestion> {
  const [question] = await createQuestions([input]);
  return question;
}

export async function updateQuestion(id: string, changes: Partial<InterviewQuestionInput>): Promise<InterviewQuestion> {
  const { question, row } = await find(id);
  const updated = { ...question, ...changes, id };
  await writeValues(`${SHEET}!A${row}:${LAST}${row}`, [toCells(updated)]);
  return updated;
}

/** One practice round: bump the counter and stamp the time (server-side, so counts never go backwards). */
export async function recordPractice(id: string): Promise<InterviewQuestion> {
  const { question, row } = await find(id);
  const updated = { ...question, lastPracticedAt: new Date().toISOString(), practiceCount: question.practiceCount + 1 };
  await writeValues(`${SHEET}!A${row}:${LAST}${row}`, [toCells(updated)]);
  return updated;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { row } = await find(id);
  await deleteRow(SHEET, row);
}
