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
  color = '#C6FF00',
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
          type="linear"
          dataKey={yKey}
          name={name ?? yKey}
          stroke={color}
          strokeWidth={3}
          fill="none"
          dot={{ r: 2, fill: color, stroke: '#FFFFFF', strokeWidth: 1 }}
          activeDot={{ r: 5, fill: color, stroke: '#FFFFFF', strokeWidth: 1.5 }}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
