import { EmptyState } from '../../../components/ui/EmptyState';
import { RowsIcon } from '../../../components/ui/icons';

interface DatasetPreviewProps {
  /** Ordered column names — the preview table follows this order. */
  columnNames: string[];
  preview: Record<string, unknown>[] | undefined;
  truncated?: boolean;
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function DatasetPreview({ columnNames, preview, truncated }: DatasetPreviewProps) {
  const columns = columnNames.length > 0 ? columnNames : undefined;

  if (!preview || preview.length === 0) {
    return (
      <EmptyState
        icon={RowsIcon}
        title="No data to preview"
        description="The dataset does not contain any rows."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
              {columns ? (
                columns.map((name) => (
                  <th key={name} className="px-4 py-3 font-mono font-semibold">
                    {name}
                  </th>
                ))
              ) : (
                <th className="px-4 py-3 font-semibold">Row</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {preview.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-white/[0.03]">
                {columns ? (
                  columns.map((name) => (
                    <td
                      key={name}
                      className="max-w-[240px] truncate whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-slate-300"
                    >
                      {renderCell(row[name])}
                    </td>
                  ))
                ) : (
                  <td className="px-4 py-2.5 font-mono text-[13px] text-slate-400">
                    {JSON.stringify(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated ? (
        <p className="border-t border-white/10 px-5 py-3 text-xs text-slate-500">
          Showing the first {preview.length} rows.
        </p>
      ) : null}
    </div>
  );
}
