import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS, CHART_GRID, ChartTooltip, formatChartValue } from '../../datasets/components/charts/chartShared';
import type { EquitySeriesPoint } from '../types';
import { formatCurrency } from '../utils/formatting';

interface EquityChartProps {
  data: EquitySeriesPoint[];
  height?: number;
}

function tickLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

/** Strategy vs Buy & Hold benchmark equity curve. */
export function EquityChart({ data, height = 320 }: EquityChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    _label: tickLabel(point.timestamp),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis
          dataKey="_label"
          tick={CHART_AXIS.tick}
          axisLine={{ stroke: CHART_AXIS.stroke }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          tick={CHART_AXIS.tick}
          axisLine={false}
          tickLine={false}
          width={70}
          tickFormatter={(value: unknown) => formatCurrency(Number(value))}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={<ChartTooltip formatter={(value: unknown) => formatCurrency(Number(value))} />}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
          formatter={(value: string) => <span className="text-slate-400">{value}</span>}
        />
        <Line
          type="monotone"
          dataKey="strategy"
          name="Strategy"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
          connectNulls
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="benchmark"
          name="Buy & Hold"
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          dot={false}
          connectNulls
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

/** Computes a drawdown series (0 to -1) from a strategy equity series. */
export function drawdownSeries(data: EquitySeriesPoint[]): { timestamp: string; drawdown: number | null }[] {
  let peak = -Infinity;
  return data.map((point) => {
    if (point.strategy !== null) {
      if (point.strategy > peak) peak = point.strategy;
      const drawdown = peak > 0 ? point.strategy / peak - 1 : null;
      return { timestamp: point.timestamp, drawdown: drawdown === null ? null : Number(drawdown.toFixed(6)) };
    }
    return { timestamp: point.timestamp, drawdown: null };
  });
}

/** Drawdown curve under the equity chart (negative percentages below peak). */
export function DrawdownChart({ data, height = 180 }: EquityChartProps) {
  const chartData = drawdownSeries(data).map((point) => ({
    drawdown: point.drawdown === null ? null : point.drawdown * 100,
    _label: tickLabel(point.timestamp),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis
          dataKey="_label"
          tick={CHART_AXIS.tick}
          axisLine={{ stroke: CHART_AXIS.stroke }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          tick={CHART_AXIS.tick}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(value: unknown) => `${Number(value).toFixed(0)}%`}
        />
        <Tooltip content={<ChartTooltip formatter={(value: unknown) => formatChartValue(`${Number(value).toFixed(2)}%`)} />} />
        <Line
          type="monotone"
          dataKey="drawdown"
          name="Drawdown"
          stroke="#fb7185"
          strokeWidth={1.5}
          dot={false}
          connectNulls
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
