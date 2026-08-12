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
    <div className="overflow-hidden border-2 border-white bg-black shadow-brutal-sm rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs font-bold uppercase tracking-wider">
          <thead>
            <tr className="border-b-2 border-white bg-ink-soft text-[10px] text-white">
              <th className="px-5 py-3.5 font-bold">Column</th>
              <th className="px-5 py-3.5 font-bold">Type</th>
              <th className="px-5 py-3.5 font-bold">Nullable</th>
              <th className="px-5 py-3.5 text-right font-bold">Null Count</th>
              <th className="px-5 py-3.5 text-right font-bold">Unique Count</th>
            </tr>
          </thead>
          <tbody className="divide-y border-white/20 bg-black text-white">
            {columns.map((column) => (
              <tr key={column.id} className="transition-colors hover:bg-ink-card">
                <td className="px-5 py-3 font-mono text-[13px] text-white normal-case">
                  {column.columnName}
                </td>
                <td className="px-5 py-3">
                  <span className="border-2 border-white bg-black px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-lime rounded-sm">
                    {column.dataType}
                  </span>
                </td>
                <td className="px-5 py-3 text-white">{column.nullable ? 'Yes' : 'No'}</td>
                <td className="px-5 py-3 text-right text-muted font-mono font-bold">
                  {formatNumber(column.nullCount)}
                </td>
                <td className="px-5 py-3 text-right text-muted font-mono font-bold">
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
