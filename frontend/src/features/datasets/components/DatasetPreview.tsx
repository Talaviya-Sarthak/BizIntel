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
    <div className="overflow-hidden border-2 border-white bg-black shadow-brutal-sm rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs font-bold uppercase tracking-wider">
          <thead>
            <tr className="border-b-2 border-white bg-ink-soft text-[10px] text-white">
              {columns ? (
                columns.map((name) => (
                  <th key={name} className="px-4 py-3.5 font-mono font-bold">
                    {name}
                  </th>
                ))
              ) : (
                <th className="px-4 py-3.5 font-bold">Row</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y border-white/20 bg-black text-white">
            {preview.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-ink-card">
                {columns ? (
                  columns.map((name) => (
                    <td
                      key={name}
                      className="max-w-[240px] truncate whitespace-nowrap px-4 py-3 font-mono text-[13px] text-white normal-case"
                    >
                      {renderCell(row[name])}
                    </td>
                  ))
                ) : (
                  <td className="px-4 py-3 font-mono text-[13px] text-muted normal-case">
                    {JSON.stringify(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated ? (
        <p className="border-t-2 border-white px-5 py-3.5 text-xs text-muted font-bold uppercase tracking-wider bg-black">
          Showing the first {preview.length} rows.
        </p>
      ) : null}
    </div>
  );
}
