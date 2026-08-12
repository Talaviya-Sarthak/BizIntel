import { clsx } from 'clsx';
import type { AnalyticsColumn, ColumnCategory } from '../../analytics/types';
import { ChevronRightIcon } from '../../../../components/ui/icons';

const CATEGORY_BADGE: Record<ColumnCategory, string> = {
  integer: 'border-2 border-lime text-lime bg-lime/10',
  float: 'border-2 border-lime text-lime bg-lime/10',
  decimal: 'border-2 border-lime text-lime bg-lime/10',
  boolean: 'border-2 border-pink text-pink bg-pink/10',
  date: 'border-2 border-pink text-pink bg-pink/10',
  time: 'border-2 border-pink text-pink bg-pink/10',
  datetime: 'border-2 border-pink text-pink bg-pink/10',
  uuid: 'border-2 border-pink text-pink bg-pink/10',
  string: 'border-2 border-yellow text-yellow bg-yellow/10',
};

interface ColumnTableProps {
  columns: AnalyticsColumn[];
  selectedColumn?: string;
  onSelect: (column: AnalyticsColumn) => void;
}

/** Selectable list of detected columns with type categorization. */
export function ColumnTable({ columns, selectedColumn, onSelect }: ColumnTableProps) {
  return (
    <div className="overflow-hidden border-2 border-white bg-black shadow-brutal-sm rounded-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-bold uppercase tracking-wider">
          <thead>
            <tr className="border-b-2 border-white bg-ink-soft text-[10px] text-white">
              <th className="px-5 py-3.5 font-bold">Column</th>
              <th className="px-5 py-3.5 font-bold">Category</th>
              <th className="px-5 py-3.5 font-bold">Detected type</th>
              <th className="px-5 py-3.5 font-bold">Nullable</th>
              <th className="px-5 py-3.5" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y border-white/20 bg-black text-white">
            {columns.map((column) => {
              const selected = selectedColumn === column.name;
              return (
                <tr
                  key={column.name}
                  onClick={() => onSelect(column)}
                  className={clsx(
                    'cursor-pointer transition-colors',
                    selected
                      ? 'bg-lime/10'
                      : 'hover:bg-ink-card',
                  )}
                >
                  <td className="max-w-[260px] truncate px-5 py-3 font-bold text-white normal-case text-sm" title={column.name}>
                    {column.name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={clsx(
                        'inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border-2',
                        CATEGORY_BADGE[column.category],
                      )}
                    >
                      {column.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted font-mono">{column.type}</td>
                  <td className="px-5 py-3 text-muted">{column.nullable ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3 text-right">
                    <ChevronRightIcon className={clsx("ml-auto h-4.5 w-4.5 transition-colors", selected ? "text-lime" : "text-muted")} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
