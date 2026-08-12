import { clsx } from 'clsx';
import type { PerformanceMetrics } from '../types';

interface BenchmarkComparisonProps {
  metrics: PerformanceMetrics | null;
  benchmark: {
    total_return: number;
    annualized_return: number;
    max_drawdown: number;
    volatility: number;
    final_equity: number;
  };
  initialCapital: number;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface ComparisonRow {
  label: string;
  strategy: number | null;
  benchmark: number;
  higherBetter: boolean;
  format: 'percent' | 'currency';
}

export function BenchmarkComparison({ metrics, benchmark, initialCapital }: BenchmarkComparisonProps) {
  const totalReturn = metrics?.totalReturn ?? null;
  const annualizedReturn = metrics?.annualizedReturn ?? metrics?.cagr ?? null;
  const maxDrawdown = metrics?.maxDrawdown ?? null;
  const volatility = metrics?.volatility ?? null;

  const rows: ComparisonRow[] = [
    {
      label: 'Total Return',
      strategy: totalReturn,
      benchmark: benchmark.total_return,
      higherBetter: true,
      format: 'percent',
    },
    {
      label: 'CAGR',
      strategy: annualizedReturn,
      benchmark: benchmark.annualized_return,
      higherBetter: true,
      format: 'percent',
    },
    {
      label: 'Max Drawdown',
      strategy: maxDrawdown,
      benchmark: benchmark.max_drawdown,
      higherBetter: false,
      format: 'percent',
    },
    {
      label: 'Volatility',
      strategy: volatility,
      benchmark: benchmark.volatility,
      higherBetter: false,
      format: 'percent',
    },
    {
      label: 'Final Equity',
      strategy: totalReturn !== null
        ? initialCapital * (1 + totalReturn)
        : null,
      benchmark: benchmark.final_equity,
      higherBetter: true,
      format: 'currency',
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Strategy vs Buy & Hold
      </h3>
      <div className="space-y-3">
        {rows.map((row) => {
          const strategyWins =
            row.strategy !== null &&
            (row.higherBetter ? row.strategy > row.benchmark : row.strategy < row.benchmark);
          const benchmarkWins =
            row.strategy !== null &&
            (row.higherBetter ? row.benchmark > row.strategy : row.benchmark < row.strategy);

          const fmt = row.format === 'percent' ? formatPercent : formatCurrency;

          return (
            <div
              key={row.label}
              className="grid grid-cols-3 items-center gap-4 rounded-lg bg-white/[0.02] px-4 py-3"
            >
              <span className="text-xs text-slate-500">{row.label}</span>

              <span
                className={clsx(
                  'text-center text-sm font-semibold',
                  strategyWins ? 'text-emerald-400' : benchmarkWins ? 'text-red-400' : 'text-white'
                )}
              >
                {row.strategy !== null ? fmt(row.strategy) : '—'}
              </span>

              <span
                className={clsx(
                  'text-right text-sm font-medium',
                  benchmarkWins ? 'text-emerald-400' : strategyWins ? 'text-red-400' : 'text-slate-400'
                )}
              >
                {fmt(row.benchmark)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
          Strategy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
          Buy & Hold
        </span>
      </div>
    </div>
  );
}
