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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DynamicChartRenderer: React.FC<DynamicChartRendererProps> = ({ visualization }) => {
  const { chartType, title, description, chartData } = visualization;
  const labels = chartData.labels || [];
  const datasets = chartData.datasets || [];
  const primaryDataset = datasets[0] || { data: [] };

  // Transform labels & data into recharts data objects
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
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 my-3">
        <h4 className="text-sm font-medium text-slate-400">{title}</h4>
        <div className="text-3xl font-bold text-indigo-400 mt-1">{kpiValue.toLocaleString()}</div>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
    );
  }

  if (chartType === 'table') {
    return (
      <div className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h4 className="text-sm font-semibold text-slate-200 mb-2">{title}</h4>
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="p-2">Name</th>
              {datasets.map((ds, i) => (
                <th key={i} className="p-2">{ds.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rechartsData.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="p-2 font-medium">{row.name}</td>
                {datasets.map((ds, i) => (
                  <td key={i} className="p-2">{row[ds.label || 'Value']}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-100 shadow-md">
      <div className="mb-3">
        <h4 className="text-sm font-bold text-slate-100">{title}</h4>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' || chartType === 'doughnut' ? (
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Pie
                data={rechartsData}
                dataKey={primaryDataset.label || 'Value'}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#6366f1"
                label
              >
                {rechartsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : chartType === 'line' ? (
            <LineChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {datasets.map((ds, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={ds.label || 'Value'}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {datasets.map((ds, i) => (
                <Bar key={i} dataKey={ds.label || 'Value'} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
