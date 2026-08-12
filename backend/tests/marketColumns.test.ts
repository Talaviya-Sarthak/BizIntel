import { describe, expect, it } from 'vitest';
import { detectMarketColumns, validateMarketData, toTimestamp } from '../src/backtesting/marketData/marketColumns';

describe('detectMarketColumns', () => {
  it('detects a standard OHLCV dataset with mixed-case headers', () => {
    const map = detectMarketColumns([
      { name: 'Date', type: 'DATE' },
      { name: 'Open', type: 'DOUBLE' },
      { name: 'High', type: 'DOUBLE' },
      { name: 'Low', type: 'DOUBLE' },
      { name: 'Close', type: 'DOUBLE' },
      { name: 'Volume', type: 'BIGINT' },
    ]);
    expect(map.compatible).toBe(true);
    expect(map).toMatchObject({
      dateColumn: 'Date',
      openColumn: 'Open',
      highColumn: 'High',
      lowColumn: 'Low',
      closeColumn: 'Close',
      volumeColumn: 'Volume',
    });
    expect(map.issues).toEqual([]);
  });

  it('falls back to type detection when no alias matches (date column)', () => {
    const map = detectMarketColumns([
      { name: 'dato', type: 'TIMESTAMP' },
      { name: 'open_p', type: 'DOUBLE' },
      { name: 'high_p', type: 'DOUBLE' },
      { name: 'low_p', type: 'DOUBLE' },
      { name: 'close_p', type: 'DOUBLE' },
    ]);
    expect(map.compatible).toBe(true);
    expect(map.dateColumn).toBe('dato');
  });

  it('reports an issue when a required column is missing', () => {
    const map = detectMarketColumns([
      { name: 'date', type: 'DATE' },
      { name: 'open', type: 'DOUBLE' },
      { name: 'high', type: 'DOUBLE' },
      { name: 'low', type: 'DOUBLE' },
    ]);
    expect(map.compatible).toBe(false);
    expect(map.closeColumn).toBeNull();
    expect(map.issues.some((issue) => issue.includes('close'))).toBe(true);
  });

  it('reports missing OHLC columns when numeric columns run out', () => {
    const map = detectMarketColumns([
      { name: 'd', type: 'TIMESTAMP' },
      { name: 'h', type: 'DOUBLE' },
    ]);
    expect(map.compatible).toBe(false);
    expect(map.openColumn).toBe('h');
    expect(map.highColumn).toBeNull();
    expect(map.closeColumn).toBeNull();
    expect(map.issues.some((issue) => issue.includes('close'))).toBe(true);
  });

  it('detects compact single-letter aliases', () => {
    const map = detectMarketColumns([
      { name: 't', type: 'TIMESTAMP' },
      { name: 'o', type: 'DOUBLE' },
      { name: 'h', type: 'DOUBLE' },
      { name: 'l', type: 'DOUBLE' },
      { name: 'c', type: 'DOUBLE' },
    ]);
    expect(map.compatible).toBe(true);
    expect(map).toMatchObject({ dateColumn: 't', openColumn: 'o', closeColumn: 'c' });
  });
});

describe('validateMarketData', () => {
  const ohlcColumns = { open: 'open', high: 'high', low: 'low', close: 'close' };

  it('accepts a clean chronological series', () => {
    const rows = [
      { timestamp: '2024-01-01', open: 100, high: 102, low: 99, close: 101, volume: 10 },
      { timestamp: '2024-01-02', open: 101, high: 103, low: 100, close: 102, volume: 11 },
      { timestamp: '2024-01-03', open: 102, high: 104, low: 101, close: 103, volume: 12 },
    ];
    expect(validateMarketData(rows, { dateColumn: 'date', ohlcColumns })).toEqual([]);
  });

  it('rejects an empty series', () => {
    const issues = validateMarketData([], { dateColumn: 'date', ohlcColumns });
    expect(issues.some((issue) => issue.includes('No market data rows'))).toBe(true);
  });

  it('rejects non-chronological timestamps', () => {
    const rows = [
      { timestamp: '2024-01-03', open: 1, high: 2, low: 1, close: 1.5, volume: null },
      { timestamp: '2024-01-01', open: 1, high: 2, low: 1, close: 1.5, volume: null },
    ];
    const issues = validateMarketData(rows, { dateColumn: 'date', ohlcColumns });
    expect(issues.some((issue) => issue.includes('chronological'))).toBe(true);
  });

  it('rejects duplicate timestamps', () => {
    const rows = [
      { timestamp: '2024-01-01', open: 1, high: 2, low: 1, close: 1.5, volume: null },
      { timestamp: '2024-01-01', open: 1, high: 2, low: 1, close: 1.5, volume: null },
    ];
    const issues = validateMarketData(rows, { dateColumn: 'date', ohlcColumns });
    expect(issues.some((issue) => issue.includes('duplicate'))).toBe(true);
  });

  it('rejects non-positive prices and broken OHLC relations', () => {
    const rows = [
      { timestamp: '2024-01-01', open: 0, high: 2, low: 1, close: 1.5, volume: null },
      { timestamp: '2024-01-02', open: 1, high: 1, low: 1, close: 5, volume: null },
    ];
    const issues = validateMarketData(rows, { dateColumn: 'date', ohlcColumns });
    expect(issues.some((issue) => issue.includes('strictly positive'))).toBe(true);
    expect(issues.some((issue) => issue.includes('high'))).toBe(true);
  });
});

describe('toTimestamp', () => {
  it('parses ISO strings, dates and numeric epochs', () => {
    expect(toTimestamp('2024-01-01')).toBe(Date.parse('2024-01-01'));
    expect(toTimestamp(new Date('2024-01-01T00:00:00Z'))).toBe(Date.parse('2024-01-01T00:00:00Z'));
    expect(toTimestamp(1704067200000)).toBe(1704067200000);
    expect(toTimestamp('garbage')).toBeNull();
    expect(toTimestamp(null)).toBeNull();
  });
});
