import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import type { BacktestEquityPoint } from '../types';

interface EquityCurveChartProps {
  equity: BacktestEquityPoint[];
  benchmark?: {
    total_return: number;
    final_equity: number;
  };
  initialCapital: number;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function EquityCurveChart({ equity, benchmark, initialCapital }: EquityCurveChartProps) {
  const chartData = equity.map((point) => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
  }));

  let benchmarkData: { date: string; benchmark: number }[] = [];
  if (benchmark && equity.length > 0) {
    const startEquity = initialCapital;
    const endEquity = benchmark.final_equity;
    const days = equity.length;

    benchmarkData = equity.map((point, i) => ({
      date: format(new Date(point.timestamp), 'MMM dd'),
      benchmark: startEquity + ((endEquity - startEquity) * i) / Math.max(days - 1, 1),
    }));
  }

  const merged = chartData.map((d, i) => ({
    ...d,
    benchmark: benchmarkData[i]?.benchmark,
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Equity Curve
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === 'equity' ? 'Portfolio' : 'Buy & Hold',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              formatter={(value) => (value === 'equity' ? 'Portfolio' : 'Buy & Hold')}
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#22d3ee' }}
            />
            {benchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
