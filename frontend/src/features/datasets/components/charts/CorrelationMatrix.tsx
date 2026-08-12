import { clsx } from 'clsx';

interface CorrelationMatrixProps {
  columns: string[];
  matrix: (number | null)[][];
}

function corrColor(r: number | null): string {
  if (r === null) return 'rgba(148,163,184,0.08)';
  const magnitude = Math.abs(r);
  if (magnitude < 0.05) return 'rgba(148,163,184,0.12)';
  const intensity = Math.min(0.9, magnitude);
  if (r > 0) return `rgba(34,211,238,${0.14 + intensity * 0.8})`;
  return `rgba(251,113,133,${0.14 + intensity * 0.8})`;
}

function describe(r: number | null): string {
  if (r === null) return 'n/a';
  const magnitude = Math.abs(r);
  const direction = r >= 0 ? 'positive' : 'negative';
  if (magnitude >= 0.7) return `strong ${direction}`;
  if (magnitude >= 0.4) return `moderate ${direction}`;
  if (magnitude >= 0.2) return `weak ${direction}`;
  return 'negligible';
}

/** Correlation heatmap grid (part-to-part of numeric columns). */
export function CorrelationMatrix({ columns, matrix }: CorrelationMatrixProps) {
  if (columns.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <table className="border-separate border-spacing-1">
          <caption className="sr-only">Pearson correlation matrix between numeric columns</caption>
          <thead>
            <tr>
              <th className="p-1" aria-label="Column" />
              {columns.map((name) => (
                <th
                  key={name}
                  className="max-w-[120px] truncate p-1 text-[11px] font-medium text-slate-400"
                  scope="col"
                  title={name}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((rowName, rowIndex) => (
              <tr key={rowName}>
                <th
                  className="max-w-[120px] truncate p-1 text-right text-[11px] font-medium text-slate-400"
                  scope="row"
                  title={rowName}
                >
                  {rowName}
                </th>
                {columns.map((_, colIndex) => {
                  const value = matrix[rowIndex]?.[colIndex] ?? null;
                  const isDiagonal = rowIndex === colIndex;
                  return (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={clsx(
                        'h-9 min-w-[52px] rounded-md text-center text-[11px] font-medium',
                        isDiagonal ? 'text-slate-500' : 'text-white',
                      )}
                      style={{ background: isDiagonal ? 'rgba(34,211,238,0.14)' : corrColor(value) }}
                      title={
                        isDiagonal
                          ? `${rowName} with itself`
                          : `${rowName} ↔ ${columns[colIndex]}: ${describe(value)} (${value === null ? 'n/a' : value.toFixed(3)})`
                      }
                    >
                      {isDiagonal ? '1' : value === null ? '·' : value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400/80" /> positive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-400/80" /> negative
        </span>
        <span className="ml-auto">Pearson correlation</span>
      </div>
    </div>
  );
}
