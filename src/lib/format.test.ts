import { describe, expect, it } from 'vitest';
import { formatPercent, percent } from './format';

describe('percent + formatPercent', () => {
  // Real figures from the owner's 203 applications (checked against the database).
  it.each([
    [4, 203, '1.97%'], // reached an interview
    [2, 203, '0.99%'], // offers
    [17, 203, '8.37%'], // rejected
    [107, 203, '52.71%'], // in progress
    [77, 203, '37.93%'], // not started
    [1, 31, '3.23%'], // Data Analyst interviewed
    [14, 23, '60.87%'], // Entry Level / Junior of the filled-in levels
  ])('%i of %i is %s', (part, total, shown) => {
    expect(formatPercent(percent(part, total))).toBe(shown);
  });

  it('keeps two decimals for whole numbers', () => {
    expect(formatPercent(percent(1, 2))).toBe('50.00%');
    expect(formatPercent(100)).toBe('100.00%');
  });

  it('shows 0% for nothing and for an empty total', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(percent(0, 0))).toBe('0%');
    expect(formatPercent(Number.NaN)).toBe('0%');
  });

  it('never rounds a small rate down to zero', () => {
    expect(formatPercent(percent(1, 1000))).toBe('0.10%');
  });
});
