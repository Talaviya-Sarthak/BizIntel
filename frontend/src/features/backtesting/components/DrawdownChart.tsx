import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { BacktestEquityPoint } from '../types';

interface DrawdownChartProps {
  equity: BacktestEquityPoint[];
}

export function DrawdownChart({ equity }: DrawdownChartProps) {
  const chartData = equity.map((point) => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
    drawdownPct: (point.drawdown ?? 0) * 100,
  }));

  const maxDrawdown = Math.min(...equity.map((p) => (p.drawdown ?? 0) * 100));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Drawdown
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Drawdown']}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            {maxDrawdown < 0 && (
              <ReferenceLine
                y={maxDrawdown}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `Max: ${maxDrawdown.toFixed(2)}%`,
                  fill: '#ef4444',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="drawdownPct"
              stroke="#ef4444"
              strokeWidth={1.5}
              fill="url(#drawdownGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
