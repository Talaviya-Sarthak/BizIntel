import type { ColumnCategory } from '../../datasets/analytics/types';

/**
 * Maps a DuckDB type name to a normalized analytics column category.
 * Mirrors the backend classifier so the query builder labels columns exactly
 * like the compiler will treat them (this is what decides date grouping,
 * numeric aggregations and filter operators).
 */
export function classifyColumnCategory(raw: string): ColumnCategory {
  const type = raw.split('(')[0]!.trim().toUpperCase();

  if (
    [
      'INTEGER',
      'BIGINT',
      'SMALLINT',
      'TINYINT',
      'UTINYINT',
      'USMALLINT',
      'UINTEGER',
      'UBIGINT',
      'HUGEINT',
      'UHUGEINT',
    ].includes(type)
  ) {
    return 'integer';
  }
  if (['FLOAT', 'REAL', 'DOUBLE'].includes(type)) return 'float';
  if (type === 'DECIMAL') return 'decimal';
  if (type === 'BOOLEAN') return 'boolean';
  if (type === 'DATE') return 'date';
  if (type === 'TIME') return 'time';
  if (type.startsWith('TIMESTAMP')) return 'datetime';
  if (type === 'UUID') return 'uuid';
  return 'string';
}

export function isNumericCategory(category: ColumnCategory): boolean {
  return category === 'integer' || category === 'float' || category === 'decimal';
}

export function isDateCategory(category: ColumnCategory): boolean {
  return category === 'date' || category === 'time' || category === 'datetime';
}

export function isCategoricalCategory(category: ColumnCategory): boolean {
  return category === 'string' || category === 'uuid' || category === 'boolean';
}
