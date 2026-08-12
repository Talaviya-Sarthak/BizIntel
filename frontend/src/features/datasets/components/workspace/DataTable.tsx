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
      className="overflow-auto border-2 border-white bg-black rounded-md shadow-brutal-sm"
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse text-left text-xs font-bold uppercase tracking-wider">
        <thead className="sticky top-0 z-10 bg-ink-soft border-b-2 border-white">
          <tr>
            <th className="sticky left-0 z-20 bg-ink-soft border-r border-white/20 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">
              #
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="max-w-[240px] truncate px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white"
                title={column.label}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y border-white/20 bg-black text-white">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="transition-colors hover:bg-ink-card">
              <td className="sticky left-0 z-10 bg-ink-soft border-r border-white/20 px-3 py-2 text-xs text-muted font-mono font-bold">
                {rowIndex + 1}
              </td>
              {columns.map((column) => {
                const value = row[column.key];
                const highlighted =
                  highlightSearch && typeof value === 'string' && value.toLowerCase().includes(highlightSearch.toLowerCase());
                return (
                  <td
                    key={column.key}
                    className={clsx(
                      'max-w-[240px] truncate px-3 py-2 normal-case font-mono text-[13px]',
                      highlighted ? 'bg-lime/20 text-lime font-black' : 'text-white',
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
  if (value === null || value === undefined) return <span className="text-pink font-black">∅</span>;
  return formatChartValue(value);
}
