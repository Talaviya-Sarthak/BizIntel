import type { DataMartQuery } from '../types';
import { formatCellValue } from '../utils/formatting';

interface QuerySummaryProps {
  query: DataMartQuery;
  /** Optional dataset name map for friendlier labels. */
  datasetNames?: Map<string, string>;
}

function datasetLabel(id: string, names?: Map<string, string>): string {
  return names?.get(id) ?? id.slice(0, 8);
}

/**
 * Human-readable review of a structured DataMart query — the builder's
 * "review" presentation and the read-only view on analysis pages.
 */
export function QuerySummary({ query, datasetNames }: QuerySummaryProps) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm">
      <SummaryItem label="Datasets">
        {query.datasets.map((id) => datasetLabel(id, datasetNames)).join(', ')}
      </SummaryItem>
      {query.dimensions.length > 0 ? (
        <SummaryItem label="Dimensions">
          {query.dimensions
            .map((dimension) =>
              dimension.granularity
                ? `${dimension.column} (${dimension.granularity})`
                : dimension.column,
            )
            .join(', ')}
        </SummaryItem>
      ) : null}
      {query.metrics.length > 0 ? (
        <SummaryItem label="Metrics">
          {query.metrics
            .map((metric) =>
              metric.formula
                ? `${metric.formula} → ${metric.alias}`
                : `${metric.aggregation}(${metric.column ?? '*'}) → ${metric.alias}`,
            )
            .join(', ')}
        </SummaryItem>
      ) : null}
      {query.joins && query.joins.length > 0 ? (
        <SummaryItem label="Joins">
          {query.joins
            .map((join) =>
              `${datasetLabel(join.leftDataset, datasetNames)}.${join.leftColumn} = ${datasetLabel(join.rightDataset, datasetNames)}.${join.rightColumn} (${join.type})`,
            )
            .join(', ')}
        </SummaryItem>
      ) : null}
      {query.filters ? (
        <SummaryItem label="Filters">
          <span className="inline-block whitespace-pre-line">{renderFilter(query.filters)}</span>
        </SummaryItem>
      ) : null}
      {query.sort && query.sort.length > 0 ? (
        <SummaryItem label="Sort">
          {query.sort
            .map((sort) => `${sort.column} ${sort.direction === 'desc' ? '↓' : '↑'}`)
            .join(', ')}
        </SummaryItem>
      ) : null}
      <SummaryItem label="Row window">
        {query.offset > 0 ? `offset ${query.offset} · ` : ''}limit {query.limit}
      </SummaryItem>
    </dl>
  );
}

function renderFilter(node: SafetyFilterNode, depth = 0): string {
  if ('conjunction' in node) {
    return `${node.nodes
      .map((child) => renderFilter(child, depth + 1))
      .join(` ${node.conjunction} `)}`;
  }
  const operator = String(node.operator ?? '').toUpperCase();
  const value = node.value !== undefined ? formatCellValue(node.value) : '';
  const value2 = node.value2 !== undefined ? ` .. ${formatCellValue(node.value2)}` : '';
  return `${node.column} ${operator} ${value}${value2}`;
}

// Local structural type so the renderer works on FilterNode without importing
// the alias chain every time.
type SafetyFilterNode =
  | { conjunction: 'AND' | 'OR'; nodes: SafetyFilterNode[] }
  | { column: string; operator: unknown; value?: unknown; value2?: unknown };

function SummaryItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-2 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-32 shrink-0 text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-slate-300">{children}</dd>
    </div>
  );
}