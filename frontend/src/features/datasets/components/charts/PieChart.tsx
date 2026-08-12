import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatChartValue, CHART_COLORS, ChartTooltip } from './chartShared';

export interface PieDatum {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieDatum[];
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
}

/** Donut chart for part-to-whole composition. Use only with few categories. */
export function PieChart({
  data,
  height = 280,
  innerRadius = '55%',
  outerRadius = '82%',
}: PieChartProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Tooltip content={<ChartTooltip />} formatter={(value: unknown) => formatChartValue(value)} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="rgba(2,6,23,0.8)"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
      <ul className="grid w-full max-w-sm grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="truncate">{entry.name}</span>
            <span className="ml-auto font-medium text-white">
              {formatChartValue(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
