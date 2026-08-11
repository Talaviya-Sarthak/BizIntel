import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { formatChartValue } from '../charts/chartShared';

export interface DataColumn {
  key: string;
  label: string;
}

interface DataTableProps {
  columns: DataColumn[];
  rows: Record<string, unknown>[];
  maxHeight?: number;
  highlightSearch?: string;
}

/** Generic read-only data table for explorer results and previews. */
export function DataTable({ columns, rows, maxHeight = 480, highlightSearch }: DataTableProps) {
  return (
    <div
      className="overflow-auto rounded-xl border border-white/10"
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-900">
          <tr>
            <th className="sticky left-0 z-20 bg-slate-900 px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              #
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="max-w-[240px] truncate px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500"
                title={column.label}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-white/5 transition hover:bg-white/[0.02]">
              <td className="sticky left-0 z-10 bg-slate-900 px-3 py-2 text-xs text-slate-600">
                {rowIndex + 1}
              </td>
              {columns.map((column) => {
                const value = row[column.key];
                const highlighted =
                  highlightSearch && typeof value === 'string' && value.includes(highlightSearch);
                return (
                  <td
                    key={column.key}
                    className={clsx(
                      'max-w-[240px] truncate px-3 py-2',
                      highlighted ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-300',
                    )}
                    title={formatChartValue(value)}
                  >
                    {formatCell(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown): ReactNode {
  if (value === null || value === undefined) return <span className="text-slate-600">∅</span>;
  return formatChartValue(value);
}
