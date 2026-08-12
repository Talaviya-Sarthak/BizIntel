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
import { formatChartValue, CHART_AXIS, CHART_COLORS, CHART_GRID, ChartTooltip } from './chartShared';

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  name?: string;
  horizontal?: boolean;
  height?: number;
  color?: string;
}

/**
 * Reusable bar chart. `horizontal` flips to a horizontal bar layout, which is
 * the right choice for many categories (top-N comparisons).
 */
export function BarChart({
  data,
  xKey,
  yKey,
  name,
  horizontal = false,
  height = 300,
  color = CHART_COLORS[0],
}: BarChartProps) {
  const axisFont = CHART_AXIS.tick;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 8, bottom: 0, left: horizontal ? 4 : 0 }}
        barCategoryGap="22%"
      >
        <CartesianGrid {...CHART_GRID} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          content={<ChartTooltip />}
          formatter={(value: unknown) => formatChartValue(value)}
        />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tick={axisFont}
              axisLine={{ stroke: CHART_AXIS.stroke }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={axisFont}
              axisLine={false}
              tickLine={false}
              width={120}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={axisFont}
              axisLine={{ stroke: CHART_AXIS.stroke }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={axisFont}
              axisLine={false}
              tickLine={false}
              width={56}
            />
          </>
        )}
        <Bar dataKey={yKey} name={name ?? yKey} radius={0} stroke="#FFFFFF" strokeWidth={1.5} fill={color}>
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length] ?? color} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
