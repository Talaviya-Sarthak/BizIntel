import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VisualizationResult } from '../../types/ai.types';

interface DynamicChartRendererProps {
  visualization: VisualizationResult;
}

const MONOCHROME_COLORS = ['#fafafa', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];

export const DynamicChartRenderer: React.FC<DynamicChartRendererProps> = ({ visualization }) => {
  const { chartType, title, description, chartData } = visualization;
  const labels = chartData.labels || [];
  const datasets = chartData.datasets || [];
  const primaryDataset = datasets[0] || { data: [] };

  const rechartsData = labels.map((label, idx) => {
    const row: Record<string, any> = { name: label };
    datasets.forEach((ds) => {
      row[ds.label || 'Value'] = ds.data[idx] ?? 0;
    });
    return row;
  });

  if (chartType === 'kpi') {
    const kpiValue = primaryDataset.data[0] ?? 0;
    return (
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 my-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</h4>
        <div className="text-3xl font-bold text-white mt-1">{kpiValue.toLocaleString()}</div>
        {description && <p className="text-xs text-zinc-500 mt-1">{description}</p>}
      </div>
    );
  }

  if (chartType === 'table') {
    return (
      <div className="my-3 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h4 className="text-sm font-semibold text-zinc-200 mb-2">{title}</h4>
        <table className="w-full text-left text-xs text-zinc-300 border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="p-2 font-medium">Name</th>
              {datasets.map((ds, i) => (
                <th key={i} className="p-2 font-medium">{ds.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rechartsData.map((row, idx) => (
              <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-800/40">
                <td className="p-2 font-medium text-zinc-200">{row.name}</td>
                {datasets.map((ds, i) => (
                  <td key={i} className="p-2 text-zinc-300">{row[ds.label || 'Value']}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-100 shadow-sm">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
        {description && <p className="text-xs text-zinc-400">{description}</p>}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' || chartType === 'doughnut' ? (
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Pie
                data={rechartsData}
                dataKey={primaryDataset.label || 'Value'}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#fafafa"
                label
              >
                {rechartsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={MONOCHROME_COLORS[index % MONOCHROME_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : chartType === 'line' ? (
            <LineChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {datasets.map((ds, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={ds.label || 'Value'}
                  stroke={MONOCHROME_COLORS[i % MONOCHROME_COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {datasets.map((ds, i) => (
                <Bar key={i} dataKey={ds.label || 'Value'} fill={MONOCHROME_COLORS[i % MONOCHROME_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
