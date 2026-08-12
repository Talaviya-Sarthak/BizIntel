import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartValue, CHART_AXIS, CHART_GRID, ChartTooltip } from './chartShared';
import type { HistogramBucket } from '../../analytics/types';

interface HistogramChartProps {
  buckets: HistogramBucket[];
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
}

/** Histogram of numeric distribution buckets returned by the backend. */
export function HistogramChart({
  buckets,
  height = 300,
  color = '#FF4D8D',
  formatValue = formatChartValue,
}: HistogramChartProps) {
  const data = buckets.map((bucket) => ({
    label: `${formatValue(bucket.min)} – ${formatValue(bucket.max)}`,
    count: bucket.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="12%">
        <CartesianGrid {...CHART_GRID} />
        <XAxis
          dataKey="label"
          tick={CHART_AXIS.tick}
          axisLine={{ stroke: CHART_AXIS.stroke }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={CHART_AXIS.tick} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<ChartTooltip />} formatter={(value: unknown) => formatChartValue(value)} />
        <Bar dataKey="count" name="Count" radius={0} stroke="#FFFFFF" strokeWidth={1} fill={color}>
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={color}
              fillOpacity={0.35 + (0.65 * (index + 1)) / Math.max(data.length, 1)}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
