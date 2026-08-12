import { clsx } from 'clsx';

interface CorrelationMatrixProps {
  columns: string[];
  matrix: (number | null)[][];
}

function corrColor(r: number | null): string {
  if (r === null) return 'rgba(255,255,255,0.03)';
  const magnitude = Math.abs(r);
  if (magnitude < 0.05) return 'rgba(255,255,255,0.05)';
  const intensity = Math.min(0.9, magnitude);
  if (r > 0) return `rgba(52,211,153,${0.14 + intensity * 0.7})`;
  return `rgba(251,113,133,${0.14 + intensity * 0.7})`;
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
                  className="max-w-[120px] truncate p-1 text-[10.5px] font-medium text-zinc-400"
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
                  className="max-w-[120px] truncate p-1 text-right text-[10.5px] font-medium text-zinc-400"
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
                        'h-8 min-w-[48px] rounded text-center text-[10.5px] font-semibold font-mono',
                        isDiagonal ? 'text-zinc-500' : 'text-zinc-100',
                      )}
                      style={{ background: isDiagonal ? 'rgba(255,255,255,0.08)' : corrColor(value) }}
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
      <div className="mt-3 flex items-center gap-3 text-[10.5px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> positive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> negative
        </span>
        <span className="ml-auto font-mono text-[10px] text-zinc-500">Pearson Correlation</span>
      </div>
    </div>
  );
}
