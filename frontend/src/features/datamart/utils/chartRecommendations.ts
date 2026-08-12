import type { DataMartQueryResult } from '../types';

/**
 * Deterministic chart recommendation for a DataMart query result.
 *
 * Rules are purely shape-based and applied in a fixed order, so the same
 * result always yields the same chart (no randomness, no magic):
 *
 *   1. date/time dimension present        → line (time series)
 *   2. single categorical dimension with
 *      ≤ 12 distinct values, 1 metric     → pie (composition)
 *   3. single categorical dimension       → bar (comparison)
 *   4. no dimensions, ≥ 2 numeric metrics → scatter (correlation)
 *   5. otherwise                          → bar (first dim × first metric)
 *
 * Returns `null` when no chart makes sense (empty rows, no metric, or a
 * single-row aggregate) so the UI can fall back to the table / KPI view.
 */

export type RecommendedChartKind = 'line' | 'bar' | 'pie' | 'scatter';

export interface ChartRecommendation {
  kind: RecommendedChartKind;
  /** Explanation shown to the user for why this chart was chosen. */
  reason: string;
  /** Category/dimension key for cartesian charts. */
  xKey?: string;
  /** Metric key for cartesian charts. */
  yKey?: string;
  /** Only set for `bar` when a horizontal layout suits long labels. */
  horizontal?: boolean;
}

const DATE_CATEGORIES = new Set(['date', 'time', 'datetime']);
const NUMERIC_CATEGORIES = new Set(['integer', 'float', 'decimal']);

function isDateCategory(category: string): boolean {
  return DATE_CATEGORIES.has(category);
}

function isNumericCategory(category: string): boolean {
  return NUMERIC_CATEGORIES.has(category);
}

function distinctCount(rows: Record<string, unknown>[], key: string): number {
  const seen = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (value !== null && value !== undefined) seen.add(String(value));
  }
  return seen.size;
}

function isMeasureColumn(column: {
  name: string;
  category: string;
  type: string;
}): boolean {
  return column.category === 'metric' || isNumericCategory(column.category);
}

export function recommendChart(result: DataMartQueryResult): ChartRecommendation | null {
  const { rows, columns } = result;
  if (!rows || rows.length === 0) return null;

  const dimensions = columns.filter((column) => !isMeasureColumn(column));
  const metrics = columns.filter(isMeasureColumn);
  if (metrics.length === 0) return null;

  const firstMetric = metrics[0]!;

  // 1. Time series: a date/time dimension drives a line chart.
  const dateDimension = dimensions.find((column) => isDateCategory(column.category));
  if (dateDimension) {
    return {
      kind: 'line',
      reason: 'A date column is grouped in this result, so a line chart best shows the trend over time.',
      xKey: dateDimension.name,
      yKey: firstMetric.name,
    };
  }

  // 2. Composition: one small categorical dimension with a single measure → pie.
  if (dimensions.length === 1 && metrics.length === 1) {
    const dimension = dimensions[0]!;
    const distinct = distinctCount(rows, dimension.name);
    if (distinct >= 2 && distinct <= 12) {
      return {
        kind: 'pie',
        reason: `"${dimension.name}" has ${distinct} categories, so a donut chart shows the share of each one.`,
        xKey: dimension.name,
        yKey: firstMetric.name,
      };
    }
  }

  // 3. Comparison: a categorical dimension → bar.
  if (dimensions.length >= 1) {
    const dimension = dimensions[0]!;
    const distinct = distinctCount(rows, dimension.name);
    return {
      kind: 'bar',
      reason: `"${dimension.name}" is categorical, so bars make it easy to compare each group.`,
      xKey: dimension.name,
      yKey: firstMetric.name,
      horizontal: distinct > 8,
    };
  }

  // 4. Correlation: no dimensions but two numeric measures → scatter.
  if (dimensions.length === 0 && metrics.length >= 2) {
    const [x, y] = metrics;
    if (x && y) {
      return {
        kind: 'scatter',
        reason: `This result pairs two numeric measures ("${x.name}" and "${y.name}"), which a scatter plot is ideal for exploring.`,
        xKey: x.name,
        yKey: y.name,
      };
    }
  }

  // 5. Single-row aggregate: no dimensions and one measure → no chart.
  if (dimensions.length === 0) {
    return null;
  }

  return null;
}