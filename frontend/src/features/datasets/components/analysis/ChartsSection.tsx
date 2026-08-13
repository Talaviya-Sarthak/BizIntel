import { useMemo, useState, type ComponentType } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  ScatterChart, Scatter, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AnalyticsColumn, CorrelationResult } from '../../analytics/types';
import { useGroupBy, useTimeSeries, useScatter } from '../../hooks/useDatasetAnalytics';
import { ChartCard } from '../charts/ChartCard';
import { ChartTooltip, CHART_COLORS, CHART_AXIS, CHART_GRID } from '../charts/chartShared';
import { ChartIcon, TrendingUpIcon, LayersIcon } from '../../../../components/ui/icons';

interface ChartsSectionProps {
  datasetId: string;
  numericColumns: AnalyticsColumn[];
  categoricalColumns: AnalyticsColumn[];
  dateColumns: AnalyticsColumn[];
  correlation?: CorrelationResult;
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}

export function ChartsSection({
  datasetId,
  numericColumns,
  categoricalColumns,
  dateColumns,
  correlation,
  onRegisterRef,
}: ChartsSectionProps) {
  const [chartType, setChartType] = useState<'all' | 'numerical' | 'categorical' | 'relationship' | 'time'>('all');

  const categories = [
    { key: 'all' as const, label: 'All Charts' },
    { key: 'numerical' as const, label: 'Numerical' },
    { key: 'categorical' as const, label: 'Categorical' },
    { key: 'relationship' as const, label: 'Relationship' },
    { key: 'time' as const, label: 'Time Series' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartIcon className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Chart Analysis</h2>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setChartType(cat.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                chartType === cat.key
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Numerical Charts */}
      {(chartType === 'all' || chartType === 'numerical') && numericColumns.length > 0 && (
        <NumericalCharts
          datasetId={datasetId}
          numericColumns={numericColumns}
          onRegisterRef={onRegisterRef}
        />
      )}

      {/* Categorical Charts */}
      {(chartType === 'all' || chartType === 'categorical') && categoricalColumns.length > 0 && (
        <CategoricalCharts
          datasetId={datasetId}
          categoricalColumns={categoricalColumns}
          onRegisterRef={onRegisterRef}
        />
      )}

      {/* Relationship Charts */}
      {(chartType === 'all' || chartType === 'relationship') && numericColumns.length >= 2 && (
        <RelationshipCharts
          datasetId={datasetId}
          correlation={correlation}
          onRegisterRef={onRegisterRef}
        />
      )}

      {/* Time Series Charts */}
      {(chartType === 'all' || chartType === 'time') && dateColumns.length > 0 && (
        <TimeSeriesCharts
          datasetId={datasetId}
          dateColumns={dateColumns}
          onRegisterRef={onRegisterRef}
        />
      )}
    </div>
  );
}

// ---- Numerical Charts ----
function NumericalCharts({
  datasetId,
  numericColumns,
  onRegisterRef,
}: {
  datasetId: string;
  numericColumns: AnalyticsColumn[];
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader icon={TrendingUpIcon} title="Numerical Distributions" count={numericColumns.length} />

      {numericColumns.map((col) => (
        <NumericalColumnCharts
          key={col.name}
          datasetId={datasetId}
          column={col}
          onRegisterRef={onRegisterRef}
        />
      ))}
    </div>
  );
}

function NumericalColumnCharts({
  datasetId,
  column,
  onRegisterRef,
}: {
  datasetId: string;
  column: AnalyticsColumn;
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  const distQuery = useGroupBy(datasetId, {
    groupBy: column.name,
    aggregation: 'count',
    topN: 30,
  });

  const data = useMemo(() => {
    if (!distQuery.data?.rows) return [];
    return distQuery.data.rows.map((r) => ({
      name: String(r.key),
      value: r.value,
    }));
  }, [distQuery.data]);

  if (data.length === 0) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Histogram / Bar Distribution */}
      <div ref={(el) => onRegisterRef(`histogram-${column.name}`, el)}>
        <ChartCard
          title={`Distribution: ${column.name}`}
          description="Frequency distribution"
          isLoading={distQuery.isLoading}
          error={distQuery.error?.message}
          onRetry={() => distQuery.refetch()}
          isEmpty={data.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" {...CHART_AXIS} tick={false} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Area Chart */}
      <div ref={(el) => onRegisterRef(`area-${column.name}`, el)}>
        <ChartCard
          title={`Area: ${column.name}`}
          description="Area visualization"
          isLoading={distQuery.isLoading}
          error={distQuery.error?.message}
          onRetry={() => distQuery.refetch()}
          isEmpty={data.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" {...CHART_AXIS} tick={false} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Line Chart */}
      <div ref={(el) => onRegisterRef(`line-${column.name}`, el)}>
        <ChartCard
          title={`Line: ${column.name}`}
          description="Line visualization"
          isLoading={distQuery.isLoading}
          error={distQuery.error?.message}
          onRetry={() => distQuery.refetch()}
          isEmpty={data.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" {...CHART_AXIS} tick={false} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie Chart */}
      {data.length <= 10 && (
        <div ref={(el) => onRegisterRef(`pie-${column.name}`, el)}>
          <ChartCard
            title={`Pie: ${column.name}`}
            description="Composition view"
            isLoading={distQuery.isLoading}
            error={distQuery.error?.message}
            onRetry={() => distQuery.refetch()}
            isEmpty={data.length === 0}
          >
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

// ---- Categorical Charts ----
function CategoricalCharts({
  datasetId,
  categoricalColumns,
  onRegisterRef,
}: {
  datasetId: string;
  categoricalColumns: AnalyticsColumn[];
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader icon={LayersIcon} title="Categorical Analysis" count={categoricalColumns.length} />

      {categoricalColumns.map((col) => (
        <CategoricalColumnCharts
          key={col.name}
          datasetId={datasetId}
          column={col}
          onRegisterRef={onRegisterRef}
        />
      ))}
    </div>
  );
}

function CategoricalColumnCharts({
  datasetId,
  column,
  onRegisterRef,
}: {
  datasetId: string;
  column: AnalyticsColumn;
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  const topQuery = useGroupBy(datasetId, {
    groupBy: column.name,
    aggregation: 'count',
    topN: 15,
  });

  const data = useMemo(() => {
    if (!topQuery.data?.rows) return [];
    return topQuery.data.rows.map((r) => ({
      name: String(r.key),
      value: r.value,
    }));
  }, [topQuery.data]);

  if (data.length === 0) return null;

  // Calculate cumulative percentage for Pareto
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  const paretoData = data.map((d) => {
    cumulative += d.value;
    return { ...d, cumulative: (cumulative / total) * 100 };
  });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Horizontal Bar Chart */}
      <div ref={(el) => onRegisterRef(`hbar-${column.name}`, el)}>
        <ChartCard
          title={`Top Values: ${column.name}`}
          description="Horizontal bar chart"
          isLoading={topQuery.isLoading}
          error={topQuery.error?.message}
          onRetry={() => topQuery.refetch()}
          isEmpty={data.length === 0}
        >
          <ResponsiveContainer width="100%" height={Math.max(260, data.length * 32)}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid {...CHART_GRID} />
              <XAxis type="number" {...CHART_AXIS} />
              <YAxis type="category" dataKey="name" {...CHART_AXIS} width={120} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie / Donut Chart */}
      {data.length <= 12 && (
        <div ref={(el) => onRegisterRef(`donut-${column.name}`, el)}>
          <ChartCard
            title={`Donut: ${column.name}`}
            description="Composition view"
            isLoading={topQuery.isLoading}
            error={topQuery.error?.message}
            onRetry={() => topQuery.refetch()}
            isEmpty={data.length === 0}
          >
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Pareto Chart */}
      <div ref={(el) => onRegisterRef(`pareto-${column.name}`, el)}>
        <ChartCard
          title={`Pareto: ${column.name}`}
          description="Bar + cumulative line"
          isLoading={topQuery.isLoading}
          error={topQuery.error?.message}
          onRetry={() => topQuery.refetch()}
          isEmpty={paretoData.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paretoData}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" {...CHART_AXIS} angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" {...CHART_AXIS} />
              <YAxis yAxisId="right" orientation="right" {...CHART_AXIS} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="value" fill={CHART_COLORS[4]} name="Count" radius={[2, 2, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke={CHART_COLORS[5]} name="Cumulative %" dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Lollipop Chart */}
      <div ref={(el) => onRegisterRef(`lollipop-${column.name}`, el)}>
        <ChartCard
          title={`Lollipop: ${column.name}`}
          description="Ranked values"
          isLoading={topQuery.isLoading}
          error={topQuery.error?.message}
          onRetry={() => topQuery.refetch()}
          isEmpty={data.length === 0}
        >
          <ResponsiveContainer width="100%" height={Math.max(260, data.length * 32)}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid {...CHART_GRID} horizontal={false} />
              <XAxis type="number" {...CHART_AXIS} />
              <YAxis type="category" dataKey="name" {...CHART_AXIS} width={120} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill={CHART_COLORS[6]} radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ---- Relationship Charts ----
function RelationshipCharts({
  datasetId,
  correlation,
  onRegisterRef,
}: {
  datasetId: string;
  correlation?: CorrelationResult;
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  const pairs = useMemo(() => {
    if (!correlation) return [];
    return correlation.pairs
      .filter((p) => p.correlation !== null)
      .sort((a, b) => Math.abs(b.correlation!) - Math.abs(a.correlation!))
      .slice(0, 4);
  }, [correlation]);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader icon={LayersIcon} title="Relationship Analysis" count={pairs.length} />

      {/* Correlation Heatmap */}
      {correlation && correlation.columns.length >= 2 && (
        <div ref={(el) => onRegisterRef('correlation-heatmap', el)}>
          <ChartCard
            title="Correlation Heatmap"
            description="Pearson correlation between numeric columns"
          >
            <CorrelationHeatmap
              columns={correlation.columns}
              matrix={correlation.matrix}
            />
          </ChartCard>
        </div>
      )}

      {/* Scatter Plots for top pairs */}
      {pairs.map((pair) => (
        <ScatterPlotPair
          key={`${pair.columnA}-${pair.columnB}`}
          datasetId={datasetId}
          x={pair.columnA}
          y={pair.columnB}
          correlation={pair.correlation!}
          onRegisterRef={onRegisterRef}
        />
      ))}
    </div>
  );
}

function CorrelationHeatmap({ columns, matrix }: { columns: string[]; matrix: (number | null)[][] }) {
  const getColor = (value: number | null) => {
    if (value === null) return 'rgba(255,255,255,0.05)';
    const abs = Math.abs(value);
    if (value > 0) {
      if (abs > 0.7) return 'rgba(34,211,238,0.8)';
      if (abs > 0.4) return 'rgba(34,211,238,0.5)';
      if (abs > 0.2) return 'rgba(34,211,238,0.3)';
      return 'rgba(34,211,238,0.1)';
    } else {
      if (abs > 0.7) return 'rgba(251,113,133,0.8)';
      if (abs > 0.4) return 'rgba(251,113,133,0.5)';
      if (abs > 0.2) return 'rgba(251,113,133,0.3)';
      return 'rgba(251,113,133,0.1)';
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        {/* Header row */}
        <div className="flex items-end gap-1 pl-[120px]">
          {columns.map((col) => (
            <div
              key={col}
              className="flex h-20 w-14 items-end justify-center text-[10px] font-medium text-slate-400"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {col}
            </div>
          ))}
        </div>
        {/* Matrix rows */}
        {matrix.map((row, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-[120px] truncate text-right text-[11px] font-medium text-slate-400">
              {columns[i]}
            </span>
            {row.map((val, j) => (
              <div
                key={j}
                className="flex h-14 w-14 items-center justify-center rounded text-[10px] font-bold text-white transition hover:scale-110"
                style={{ backgroundColor: getColor(val) }}
                title={`${columns[i]} × ${columns[j]}: ${val?.toFixed(3) ?? 'N/A'}`}
              >
                {val !== null ? val.toFixed(2) : '—'}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScatterPlotPair({
  datasetId,
  x,
  y,
  correlation,
  onRegisterRef,
}: {
  datasetId: string;
  x: string;
  y: string;
  correlation: number;
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  const scatterQuery = useScatter(datasetId, { x, y, sample: 1000 });

  const data = useMemo(() => {
    if (!scatterQuery.data?.points) return [];
    return scatterQuery.data.points.map((p: { x: number; y: number }) => ({
      x: p.x,
      y: p.y,
    }));
  }, [scatterQuery.data]);

  return (
    <div ref={(el) => onRegisterRef(`scatter-${x}-${y}`, el)}>
      <ChartCard
        title={`${x} vs ${y}`}
        description={`Correlation: ${correlation.toFixed(3)} (${correlation > 0 ? 'positive' : 'negative'})`}
        isLoading={scatterQuery.isLoading}
        error={scatterQuery.error?.message}
        onRetry={() => scatterQuery.refetch()}
        isEmpty={data.length === 0}
      >
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart>
            <CartesianGrid {...CHART_GRID} />
            <XAxis type="number" dataKey="x" name={x} {...CHART_AXIS} />
            <YAxis type="number" dataKey="y" name={y} {...CHART_AXIS} />
            <Tooltip content={<ChartTooltip />} />
            <Scatter data={data} fill={CHART_COLORS[7]} fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ---- Time Series Charts ----
function TimeSeriesCharts({
  datasetId,
  dateColumns,
  onRegisterRef,
}: {
  datasetId: string;
  dateColumns: AnalyticsColumn[];
  onRegisterRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  const dateCol = dateColumns[0]!;

  const monthQuery = useTimeSeries(datasetId, {
    dateColumn: dateCol.name,
    aggregation: 'count',
    granularity: 'month',
  });

  const weekQuery = useTimeSeries(datasetId, {
    dateColumn: dateCol.name,
    aggregation: 'count',
    granularity: 'week',
  });

  const monthData = useMemo(() => {
    if (!monthQuery.data?.points) return [];
    return monthQuery.data.points.map((p) => ({ label: p.label, value: p.value }));
  }, [monthQuery.data]);

  const weekData = useMemo(() => {
    if (!weekQuery.data?.points) return [];
    return weekQuery.data.points.map((p) => ({ label: p.label, value: p.value }));
  }, [weekQuery.data]);

  // Moving average
  const movingAvgData = useMemo(() => {
    if (monthData.length < 3) return [];
    const window = 3;
    return monthData.map((d, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = monthData.slice(start, i + 1);
      const avg = slice.reduce((sum, s) => sum + s.value, 0) / slice.length;
      return { ...d, movingAvg: Math.round(avg * 100) / 100 };
    });
  }, [monthData]);

  // Cumulative
  const cumulativeData = useMemo(() => {
    if (monthData.length === 0) return [];
    let cumulative = 0;
    return monthData.map((d) => {
      cumulative += d.value;
      return { ...d, cumulative };
    });
  }, [monthData]);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader icon={TrendingUpIcon} title={`Time Series (${dateCol.name})`} count={4} />

      {/* Monthly Trend */}
      <div ref={(el) => onRegisterRef('ts-monthly', el)}>
        <ChartCard
          title="Monthly Trend"
          description={`Row counts per month (${dateCol.name})`}
          isLoading={monthQuery.isLoading}
          error={monthQuery.error?.message}
          onRetry={() => monthQuery.refetch()}
          isEmpty={monthData.length === 0}
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthData}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="label" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.2} name="Count" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Weekly Trend */}
      <div ref={(el) => onRegisterRef('ts-weekly', el)}>
        <ChartCard
          title="Weekly Trend"
          description={`Row counts per week (${dateCol.name})`}
          isLoading={weekQuery.isLoading}
          error={weekQuery.error?.message}
          onRetry={() => weekQuery.refetch()}
          isEmpty={weekData.length === 0}
        >
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={weekData}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="label" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} name="Count" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Moving Average */}
      {movingAvgData.length > 0 && (
        <div ref={(el) => onRegisterRef('ts-movingavg', el)}>
          <ChartCard
            title="Moving Average (3-month)"
            description="Smoothed trend line"
          >
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={movingAvgData}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="label" {...CHART_AXIS} />
                <YAxis {...CHART_AXIS} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} name="Actual" />
                <Line type="monotone" dataKey="movingAvg" stroke={CHART_COLORS[3]} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Moving Avg" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Cumulative Growth */}
      <div ref={(el) => onRegisterRef('ts-cumulative', el)}>
        <ChartCard
          title="Cumulative Growth"
          description="Running total over time"
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={cumulativeData}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="label" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="cumulative" stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.2} name="Cumulative" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ---- Helpers ----
function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
      <Icon className="h-4 w-4 text-zinc-300" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-100">{title}</h2>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
        {count}
      </span>
    </div>
  );
}
