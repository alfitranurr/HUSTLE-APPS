import { describe, expect, it } from 'vitest';
import { timestamptzToWall, toDateOnly, wallToTimestamptz } from './jakartaTime';

describe('wallToTimestamptz', () => {
  it('reads form and sheet formats as Jakarta wall-clock time', () => {
    expect(wallToTimestamptz('2026-05-02T15:25')).toBe('2026-05-02T15:25:00+07:00');
    expect(wallToTimestamptz('2026-05-02 15:25')).toBe('2026-05-02T15:25:00+07:00');
    expect(wallToTimestamptz('2026-5-2')).toBe('2026-05-02T00:00:00+07:00');
    expect(wallToTimestamptz('5/24/2026 7:18:03')).toBe('2026-05-24T07:18:03+07:00');
  });

  it('passes instants with a zone through as UTC', () => {
    expect(wallToTimestamptz('2026-05-02T08:25:00.000Z')).toBe('2026-05-02T08:25:00.000Z');
    expect(wallToTimestamptz('2026-05-02T15:25:00+07:00')).toBe('2026-05-02T08:25:00.000Z');
  });

  it('rejects empty and impossible dates', () => {
    expect(wallToTimestamptz('')).toBeNull();
    expect(wallToTimestamptz(undefined)).toBeNull();
    expect(wallToTimestamptz('2026-02-30')).toBeNull();
    expect(wallToTimestamptz('2026-05-02T25:00')).toBeNull();
    expect(wallToTimestamptz('yesterday')).toBeNull();
  });
});

describe('timestamptzToWall', () => {
  it('shows the Jakarta wall clock whatever zone Postgres returns', () => {
    expect(timestamptzToWall('2026-05-02T08:25:00+00:00')).toBe('2026-05-02T15:25');
    expect(timestamptzToWall('2026-05-02 08:25:00+00')).toBe('2026-05-02T15:25');
    expect(timestamptzToWall('2026-05-02T20:00:00Z')).toBe('2026-05-03T03:00');
  });

  it('keeps seconds only when there are some', () => {
    expect(timestamptzToWall('2026-05-24T00:18:03Z')).toBe('2026-05-24T07:18:03');
  });

  it('round-trips with wallToTimestamptz', () => {
    for (const wall of ['2026-05-02T15:25', '2026-12-31T23:59', '2026-01-01T00:00']) {
      expect(timestamptzToWall(wallToTimestamptz(wall))).toBe(wall);
    }
  });

  it('is empty for null', () => {
    expect(timestamptzToWall(null)).toBe('');
  });
});

describe('toDateOnly', () => {
  it('keeps the Jakarta date', () => {
    expect(toDateOnly('2026-07-01')).toBe('2026-07-01');
    expect(toDateOnly('2026-06-30T20:00:00Z')).toBe('2026-07-01');
    expect(toDateOnly('')).toBeNull();
  });
});
