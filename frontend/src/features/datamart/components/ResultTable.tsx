import { clsx } from 'clsx';
import type { DataMartQueryResult } from '../types';
import { formatCellValue } from '../utils/formatting';

interface ResultTableProps {
  result: DataMartQueryResult;
  /** Cap rendered rows (pagination is handled by the page). */
  maxRows?: number;
}

/**
 * Read-only table for a query result. Rows are keyed by the user-facing
 * column names returned by the backend. Shows up to `maxRows` rows with an
 * ellipsis indicator when the result was truncated.
 */
export function ResultTable({ result, maxRows = 100 }: ResultTableProps) {
  const { columns, rows, truncated, totalRows } = result;
  const visible = rows.slice(0, maxRows);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Query result">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="w-10 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column.name}
                  className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400"
                >
                  {column.name}
                  <span className="ml-1.5 normal-case tracking-normal text-slate-600">
                    {column.type}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr
                key={index}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-2 text-xs tabular-nums text-slate-600">{index + 1}</td>
                {columns.map((column) => (
                  <td
                    key={column.name}
                    className={clsx(
                      'max-w-[240px] truncate px-4 py-2 text-slate-300',
                      column.category === 'metric'
                        ? 'text-right font-medium tabular-nums text-white'
                        : '',
                    )}
                    title={
                      formatCellValue(row[column.name]) || undefined
                    }
                  >
                    {formatCellValue(row[column.name])}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No rows returned.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-xs text-slate-500">
        <span>
          Showing {rows.length === 0 ? 0 : `1–${visible.length}`} of{' '}
          {totalRows.toLocaleString('en-US')} rows
        </span>
        {truncated ? (
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-amber-300">
            Truncated to limit
          </span>
        ) : null}
      </div>
    </div>
  );
}