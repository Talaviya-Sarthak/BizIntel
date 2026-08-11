import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { formatChartValue, CHART_AXIS, CHART_GRID, ChartTooltip } from './chartShared';

interface ScatterChartProps {
  data: { x: number; y: number }[];
  xName: string;
  yName: string;
  height?: number;
  color?: string;
}

/** Scatter plot for correlation/cluster/outlier exploration. */
export function ScatterChart({
  data,
  xName,
  yName,
  height = 340,
  color = '#22d3ee',
}: ScatterChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis
          type="number"
          dataKey="x"
          name={xName}
          tick={CHART_AXIS.tick}
          axisLine={{ stroke: CHART_AXIS.stroke }}
          tickLine={false}
          tickFormatter={(value: number) => formatChartValue(value)}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yName}
          tick={CHART_AXIS.tick}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={(value: number) => formatChartValue(value)}
        />
        <ZAxis range={[36, 36]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={<ChartTooltip formatter={(value) => formatChartValue(value)} />}
        />
        <Scatter data={data} fill={color} fillOpacity={0.55} />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}
