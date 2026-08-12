import { describe, expect, it } from 'vitest';
import { ApiError } from '../../utils/httpError';
import { compileFormula, type FormulaContext } from './formula';

function context(columns: string[], numeric: string[] = []): FormulaContext {
  const set = new Set(columns);
  const numericSet = new Set(numeric);
  return {
    resolveColumnSql: (name) => {
      if (!set.has(name)) return null;
      return `d0."${name.replace(/"/g, '""')}"`;
    },
    isNumericColumn: (name) => numericSet.has(name),
  };
}

function expectError(fn: () => unknown, code: string): void {
  try {
    fn();
    expect.unreachable('expected an ApiError');
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
  }
}

describe('compileFormula', () => {
  it('compiles a simple aggregate', () => {
    const result = compileFormula('SUM(profit)', context(['profit'], ['profit']));
    expect(result.sql).toBe('sum(d0."profit")');
    expect(result.hasAggregation).toBe(true);
  });

  it('compiles a ratio of aggregates', () => {
    const result = compileFormula(
      'SUM(profit) / SUM(revenue)',
      context(['profit', 'revenue'], ['profit', 'revenue']),
    );
    expect(result.sql).toBe('(sum(d0."profit") / sum(d0."revenue"))');
  });

  it('compiles arithmetic with constants', () => {
    const result = compileFormula(
      'SUM(revenue) * 1.1 - 100',
      context(['revenue'], ['revenue']),
    );
    expect(result.sql).toBe('((sum(d0."revenue") * 1.1) - 100)');
  });

  it('compiles count distinct', () => {
    const result = compileFormula(
      'COUNT(DISTINCT customer_id)',
      context(['customer_id']),
    );
    expect(result.sql).toBe('count(DISTINCT d0."customer_id")');
  });

  it('compiles count(*)', () => {
    const result = compileFormula('COUNT()', context([]));
    expect(result.sql).toBe('count(*)');
  });

  it('compiles parenthesized expressions', () => {
    const result = compileFormula(
      '(SUM(a) + SUM(b)) * 2',
      context(['a', 'b'], ['a', 'b']),
    );
    expect(result.sql).toBe('((sum(d0."a") + sum(d0."b")) * 2)');
  });

  it('reports hasAggregation=false for a pure constant', () => {
    const result = compileFormula('42', context([]));
    expect(result.sql).toBe('42');
    expect(result.hasAggregation).toBe(false);
  });

  it('rejects a bare column outside an aggregation', () => {
    expectError(
      () => compileFormula('profit', context(['profit'], ['profit'])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects a bare column mixed with an aggregate', () => {
    expectError(
      () => compileFormula('SUM(profit) / revenue', context(['profit', 'revenue'], ['profit', 'revenue'])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects unknown columns', () => {
    expectError(
      () => compileFormula('SUM(nope)', context(['profit'], ['profit'])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects unknown functions', () => {
    expectError(
      () => compileFormula('TOTALLY_SUM(profit)', context(['profit'], ['profit'])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects nested aggregations', () => {
    expectError(
      () => compileFormula('SUM(SUM(profit))', context(['profit'], ['profit'])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects division by a constant zero', () => {
    expectError(
      () => compileFormula('SUM(a) / 0', context(['a'], ['a'])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects a non-numeric column inside a numeric aggregate', () => {
    expectError(
      () =>
        compileFormula('SUM(customer_name)', context(['customer_name'], [])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects malformed syntax', () => {
    expectError(() => compileFormula('SUM(profit', context(['profit'], ['profit'])), 'DATAMART_INVALID_METRIC');
    expectError(() => compileFormula('SUM() /', context([])), 'DATAMART_INVALID_METRIC');
    expectError(() => compileFormula('', context([])), 'DATAMART_INVALID_METRIC');
    expectError(() => compileFormula('   ', context([])), 'DATAMART_INVALID_METRIC');
    expectError(() => compileFormula('SUM(profit) SUM(revenue)', context(['profit', 'revenue'], ['profit', 'revenue'])), 'DATAMART_INVALID_METRIC');
  });

  it('rejects COUNT(DISTINCT *)', () => {
    expectError(
      () => compileFormula('COUNT(DISTINCT *)', context([])),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('treats column names with spaces as single tokens', () => {
    const result = compileFormula(
      'SUM(total revenue)',
      context(['total revenue'], ['total revenue']),
    );
    expect(result.sql).toBe('sum(d0."total revenue")');
  });

  it('quotes identifiers safely', () => {
    const result = compileFormula(
      'SUM(col"quote)',
      context(['col"quote'], ['col"quote']),
    );
    expect(result.sql).toBe('sum(d0."col""quote")');
  });
});
