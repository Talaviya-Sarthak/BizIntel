import { describe, expect, it } from 'vitest';
import { clampNumber, mean, roundMoney, roundPrice, sampleStdDev, wholeShares } from '../src/backtesting/utils/money.js';

describe('money utilities', () => {
  it('rounds money to 2 decimals and prices to 6 decimals', () => {
    expect(roundMoney(10.126)).toBe(10.13);
    expect(roundMoney(10.124)).toBe(10.12);
    expect(roundPrice(101.05055)).toBe(101.05055);
    expect(roundPrice(101.050555)).toBe(101.050555);
    expect(roundPrice(1.0000004)).toBe(1);
  });

  it('floors non-negative whole shares', () => {
    expect(wholeShares(98.8613)).toBe(98);
    expect(wholeShares(-3.2)).toBe(0);
    expect(wholeShares(NaN)).toBe(0);
    expect(wholeShares(0.999)).toBe(0);
  });

  it('clamps numbers and replaces NaN with fallback', () => {
    expect(clampNumber(50, 0, 100)).toBe(50);
    expect(clampNumber(-5, 0, 100)).toBe(0);
    expect(clampNumber(500, 0, 100)).toBe(100);
    expect(clampNumber(NaN, 0, 100, 7)).toBe(7);
  });

  it('computes sample standard deviation', () => {
    expect(sampleStdDev([])).toBeNull();
    expect(sampleStdDev([5])).toBeNull();
    expect(sampleStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.1381, 4);
  });

  it('computes the mean', () => {
    expect(mean([])).toBeNull();
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
});
