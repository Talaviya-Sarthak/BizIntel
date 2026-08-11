import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartValue, CHART_AXIS, CHART_GRID, ChartTooltip } from './chartShared';

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  name?: string;
  height?: number;
  color?: string;
}

/** Reusable line/area chart for time-series trends and ordered data. */
export function LineChart({
  data,
  xKey,
  yKey,
  name,
  height = 300,
  color = '#22d3ee',
}: LineChartProps) {
  const gradientId = `ps05-grad-${yKey}`.replace(/[^a-zA-Z0-9-]/g, '-');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <XAxis
          dataKey={xKey}
          tick={CHART_AXIS.tick}
          axisLine={{ stroke: CHART_AXIS.stroke }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={CHART_AXIS.tick} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<ChartTooltip />} formatter={(value: unknown) => formatChartValue(value)} />
        <Area
          type="monotone"
          dataKey={yKey}
          name={name ?? yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
