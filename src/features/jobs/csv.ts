import { formatDate, formatDateTime } from '@/lib/format';
import type { Job } from '@/lib/types';

const COLUMNS: [header: string, value: (job: Job) => string][] = [
  ['Company', (j) => j.company],
  ['Position', (j) => j.position],
  ['Status', (j) => j.status],
  ['Stage', (j) => j.stage],
  ['Applied', (j) => formatDate(j.appliedAt)],
  ['Scheduled', (j) => (j.scheduledAt ? formatDateTime(j.scheduledAt) : '')],
  ['Contract date', (j) => (j.contractDate ? formatDate(j.contractDate) : '')],
  ['Stage dates', (j) => Object.entries(j.stageDates).map(([stage, date]) => `${stage}: ${formatDate(date)}`).join('; ')],
  ['Platform', (j) => j.platform],
  ['Career level', (j) => j.careerLevel],
  ['City', (j) => j.city],
  ['Province', (j) => j.province],
  ['LinkedIn', (j) => j.links.linkedin],
  ['Website', (j) => j.links.website],
  ['Instagram', (j) => j.links.instagram],
  ['Other link', (j) => j.links.other],
  ['Attachments', (j) => j.attachments.join(' ')],
  ['Notes', (j) => j.note],
  ['Last updated', (j) => formatDate(j.updatedAt)],
];

/** Quotes a cell and neutralises spreadsheet formulas (CSV injection). */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function jobsToCsv(jobs: Job[]): string {
  const lines = [COLUMNS.map(([h]) => cell(h)).join(',')];
  for (const job of jobs) lines.push(COLUMNS.map(([, get]) => cell(get(job) ?? '')).join(','));
  return lines.join('\r\n');
}

/** Triggers a download. The BOM makes Excel read the file as UTF-8. */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
