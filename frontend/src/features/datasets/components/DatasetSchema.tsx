import { EmptyState } from '../../../components/ui/EmptyState';
import { ColumnsIcon } from '../../../components/ui/icons';
import { formatNumber } from '../../../utils/format';
import type { DatasetColumn } from '../types';

interface DatasetSchemaProps {
  columns: DatasetColumn[] | undefined;
}

export function DatasetSchema({ columns }: DatasetSchemaProps) {
  if (!columns || columns.length === 0) {
    return (
      <EmptyState
        icon={ColumnsIcon}
        title="No schema detected"
        description="Column metadata becomes available once the dataset is processed."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-semibold">Column</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Nullable</th>
              <th className="px-5 py-3 text-right font-semibold">Null Count</th>
              <th className="px-5 py-3 text-right font-semibold">Unique Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {columns.map((column) => (
              <tr key={column.id} className="transition hover:bg-white/[0.03]">
                <td className="px-5 py-3 font-mono text-[13px] text-white">
                  {column.columnName}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
                    {column.dataType}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-300">{column.nullable ? 'Yes' : 'No'}</td>
                <td className="px-5 py-3 text-right text-slate-400">
                  {formatNumber(column.nullCount)}
                </td>
                <td className="px-5 py-3 text-right text-slate-400">
                  {formatNumber(column.uniqueCount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
