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
    <div className="flex flex-col items-center gap-4 bg-black">
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
            stroke="#000000"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
      <ul className="grid w-full max-w-sm grid-cols-2 gap-x-4 gap-y-2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <span
              className="h-3.5 w-3.5 shrink-0 border border-white rounded-none"
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="truncate">{entry.name}</span>
            <span className="ml-auto font-black text-white">
              {formatChartValue(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
