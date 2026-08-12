import { clsx } from 'clsx';

interface CorrelationMatrixProps {
  columns: string[];
  matrix: (number | null)[][];
}

function corrColor(r: number | null): string {
  if (r === null) return 'rgba(115,115,115,0.1)';
  const magnitude = Math.abs(r);
  if (magnitude < 0.05) return 'rgba(115,115,115,0.15)';
  const intensity = Math.min(0.9, magnitude);
  if (r > 0) return `rgba(198,255,0,${0.15 + intensity * 0.85})`;
  return `rgba(255,77,141,${0.15 + intensity * 0.85})`;
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
    <div className="overflow-x-auto bg-black p-1">
      <div className="inline-block min-w-full">
        <table className="border-separate border-spacing-1.5">
          <caption className="sr-only">Pearson correlation matrix between numeric columns</caption>
          <thead>
            <tr>
              <th className="p-1" aria-label="Column" />
              {columns.map((name) => (
                <th
                  key={name}
                  className="max-w-[120px] truncate p-1 text-[10px] font-bold uppercase tracking-wider text-muted"
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
                  className="max-w-[120px] truncate p-1 text-right text-[10px] font-bold uppercase tracking-wider text-muted"
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
                        'h-9 min-w-[52px] text-center text-[10px] font-black border border-white/20 rounded-none',
                        isDiagonal ? 'text-muted bg-lime/10' : 'text-white',
                      )}
                      style={{ background: isDiagonal ? 'rgba(198,255,0,0.2)' : corrColor(value) }}
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
      <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted border-t border-white/10 pt-3">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 border border-white bg-lime" /> positive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 border border-white bg-pink" /> negative
        </span>
        <span className="ml-auto">Pearson correlation</span>
      </div>
    </div>
  );
}
