import { describe, expect, it } from 'vitest';
import type { DatasetColumn } from '../models/dataset.model.js';
import { ApiError } from './httpError.js';
import {
  buildFilterWhere,
  coerceFilterValue,
  qualifiedIdent,
  resolveColumn,
} from './filterSql.js';
import type { FilterNode } from '../types/analytics.js';

function column(columnName: string, dataType: string): DatasetColumn {
  return {
    id: `id_${columnName}`,
    datasetId: 'ds',
    columnName,
    dataType,
    nullable: true,
    ordinalPosition: 0,
    uniqueCount: null,
    nullCount: null,
    createdAt: new Date(),
  };
}

const columns: DatasetColumn[] = [
  column('region', 'VARCHAR'),
  column('amount', 'DOUBLE'),
  column('is_active', 'BOOLEAN'),
  column('created_date', 'DATE'),
];

function expectApiError(fn: () => unknown, code: string): void {
  try {
    fn();
    expect.unreachable('expected ApiError');
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
  }
}

describe('buildFilterWhere', () => {
  it('returns an empty clause for undefined input', () => {
    expect(buildFilterWhere(undefined, columns)).toEqual({ clause: '', params: [] });
  });

  it('builds a single equality condition', () => {
    const { clause, params } = buildFilterWhere({ column: 'region', operator: 'eq', value: 'EU' }, columns);
    expect(clause).toBe('"region" = ?');
    expect(params).toEqual(['EU']);
  });

  it('qualifies identifiers with a prefix', () => {
    const { clause } = buildFilterWhere(
      { column: 'amount', operator: 'gt', value: 10 },
      columns,
      { prefix: 'd0' },
    );
    expect(clause).toBe('d0."amount" > ?');
  });

  it('uses the resolveQualified option when provided', () => {
    const { clause } = buildFilterWhere(
      { column: 'region', operator: 'eq', value: 'EU' },
      columns,
      { resolveQualified: (name) => `d0."${name}"` },
    );
    expect(clause).toBe('d0."region" = ?');
  });

  it('combines a group with AND', () => {
    const node: FilterNode = {
      conjunction: 'AND',
      nodes: [
        { column: 'region', operator: 'eq', value: 'EU' },
        { column: 'amount', operator: 'gte', value: 100 },
      ],
    };
    const { clause, params } = buildFilterWhere(node, columns);
    expect(clause).toBe('("region" = ? AND "amount" >= ?)');
    expect(params).toEqual(['EU', 100]);
  });

  it('nests groups', () => {
    const node: FilterNode = {
      conjunction: 'OR',
      nodes: [
        { column: 'region', operator: 'eq', value: 'US' },
        {
          conjunction: 'AND',
          nodes: [
            { column: 'region', operator: 'eq', value: 'EU' },
            { column: 'amount', operator: 'gt', value: 50 },
          ],
        },
      ],
    };
    const { clause } = buildFilterWhere(node, columns);
    expect(clause).toBe('("region" = ? OR ("region" = ? AND "amount" > ?))');
  });

  it('builds IS NULL / IS NOT NULL', () => {
    expect(buildFilterWhere({ column: 'region', operator: 'is_null' }, columns)).toEqual({
      clause: '"region" IS NULL',
      params: [],
    });
    expect(buildFilterWhere({ column: 'region', operator: 'is_not_null' }, columns)).toEqual({
      clause: '"region" IS NOT NULL',
      params: [],
    });
  });

  it('builds LIKE conditions with escaped values', () => {
    const { clause, params } = buildFilterWhere(
      { column: 'region', operator: 'contains', value: 'a%b_c' },
      columns,
    );
    expect(clause).toBe(`CAST("region" AS VARCHAR) ILIKE '%' || ? || '%'`);
    expect(params).toEqual(['a\\%b\\_c']);
  });

  it('builds IN / NOT IN conditions', () => {
    const inClause = buildFilterWhere(
      { column: 'region', operator: 'in', value: ['EU', 'US'] },
      columns,
    );
    expect(inClause.clause).toBe('"region" IN (?, ?)');
    expect(inClause.params).toEqual(['EU', 'US']);

    const notIn = buildFilterWhere(
      { column: 'region', operator: 'not_in', value: ['EU'] },
      columns,
    );
    expect(notIn.clause).toBe('"region" NOT IN (?)');
  });

  it('builds BETWEEN with both bounds', () => {
    const { clause, params } = buildFilterWhere(
      { column: 'amount', operator: 'between', value: 10, value2: 20 },
      columns,
    );
    expect(clause).toBe('"amount" BETWEEN ? AND ?');
    expect(params).toEqual([10, 20]);
  });

  it('coerces numeric and boolean values', () => {
    const numeric = buildFilterWhere({ column: 'amount', operator: 'eq', value: '42' }, columns);
    expect(numeric.params).toEqual([42]);

    const bool = buildFilterWhere({ column: 'is_active', operator: 'eq', value: 'true' }, columns);
    expect(bool.params).toEqual([true]);
  });

  it('throws COLUMN_NOT_FOUND for unknown columns', () => {
    expectApiError(
      () => buildFilterWhere({ column: 'nope', operator: 'eq', value: 1 }, columns),
      'COLUMN_NOT_FOUND',
    );
  });

  it('throws INVALID_FILTER_OPERATOR for unsupported operators', () => {
    expectApiError(
      () =>
        buildFilterWhere(
          { column: 'region', operator: 'regex' as never, value: 'x' },
          columns,
        ),
      'INVALID_FILTER_OPERATOR',
    );
  });
});

describe('qualifiedIdent / resolveColumn / coerceFilterValue', () => {
  it('quotes identifiers', () => {
    expect(qualifiedIdent('region')).toBe('"region"');
    expect(qualifiedIdent('region', 'd0')).toBe('d0."region"');
  });

  it('resolves a column by name', () => {
    expect(resolveColumn(columns, 'region').columnName).toBe('region');
  });

  it('coerces values by column category', () => {
    expect(coerceFilterValue(columns[1]!, '12.5')).toBe(12.5);
    expect(coerceFilterValue(columns[3]!, '2024-01-01')).toBe('2024-01-01');
  });
});
