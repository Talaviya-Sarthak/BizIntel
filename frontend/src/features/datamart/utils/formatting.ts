import type { MetricDefinition, MetricFormat } from '../types';

/**
 * Formats a raw metric value according to its declared format.
 *
 *  - number:   compact, up to 2 decimals
 *  - currency: US dollars, 2 decimals
 *  - percent:  ratio (0.25) rendered as "25%"
 *  - decimal:  full precision (up to 6 decimals)
 *  - compact:  abbreviated (Intl "compact" notation)
 */
export function formatMetricValue(
  value: unknown,
  format: MetricFormat,
  digits = 2,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  switch (format) {
    case 'currency':
      return numeric.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case 'percent':
      return `${(numeric * 100).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
      })}%`;
    case 'decimal':
      return numeric.toLocaleString('en-US', {
        maximumFractionDigits: 6,
      });
    case 'compact':
      return Intl.NumberFormat('en-US', { notation: 'compact' }).format(numeric);
    case 'number':
    default:
      return numeric.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
      });
  }
}

/** Human-readable label for a metric definition, e.g. "SUM(revenue)". */
export function describeMetricDefinition(definition: MetricDefinition): string {
  if (definition.kind === 'aggregate') {
    return `${definition.aggregation.toUpperCase()}(${definition.column})`;
  }
  return definition.formula;
}

export const METRIC_FORMAT_LABELS: Record<MetricFormat, string> = {
  number: 'Number',
  currency: 'Currency',
  percent: 'Percent',
  decimal: 'Decimal',
  compact: 'Compact',
};

/** Renders a value in a result cell as plain text (null-safe). */
export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}