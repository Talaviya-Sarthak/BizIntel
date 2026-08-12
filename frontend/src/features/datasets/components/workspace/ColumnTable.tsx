import { clsx } from 'clsx';
import type { AnalyticsColumn, ColumnCategory } from '../../analytics/types';
import { ChevronRightIcon } from '../../../../components/ui/icons';

const CATEGORY_BADGE: Record<ColumnCategory, string> = {
  integer: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/30',
  float: 'bg-sky-400/10 text-sky-300 ring-sky-400/30',
  decimal: 'bg-blue-400/10 text-blue-300 ring-blue-400/30',
  boolean: 'bg-violet-400/10 text-violet-300 ring-violet-400/30',
  date: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  time: 'bg-teal-400/10 text-teal-300 ring-teal-400/30',
  datetime: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  uuid: 'bg-fuchsia-400/10 text-fuchsia-300 ring-fuchsia-400/30',
  string: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
};

interface ColumnTableProps {
  columns: AnalyticsColumn[];
  selectedColumn?: string;
  onSelect: (column: AnalyticsColumn) => void;
}

/** Selectable list of detected columns with type categorization. */
export function ColumnTable({ columns, selectedColumn, onSelect }: ColumnTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-medium">Column</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Detected type</th>
              <th className="px-5 py-3 font-medium">Nullable</th>
              <th className="px-5 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr
                key={column.name}
                onClick={() => onSelect(column)}
                className={clsx(
                  'cursor-pointer border-b border-white/5 transition last:border-0',
                  selectedColumn === column.name
                    ? 'bg-cyan-400/[0.06]'
                    : 'hover:bg-white/[0.03]',
                )}
              >
                <td className="max-w-[260px] truncate px-5 py-3 font-medium text-white" title={column.name}>
                  {column.name}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={clsx(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1',
                      CATEGORY_BADGE[column.category],
                    )}
                  >
                    {column.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">{column.type}</td>
                <td className="px-5 py-3 text-slate-400">{column.nullable ? 'Yes' : 'No'}</td>
                <td className="px-5 py-3 text-right">
                  <ChevronRightIcon className="ml-auto h-4 w-4 text-slate-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
