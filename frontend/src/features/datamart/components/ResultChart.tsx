import type { DataMartQueryResult } from '../types';
import { BarChart } from '../../datasets/components/charts/BarChart';
import { LineChart } from '../../datasets/components/charts/LineChart';
import { PieChart } from '../../datasets/components/charts/PieChart';
import { ScatterChart } from '../../datasets/components/charts/ScatterChart';
import { recommendChart, type ChartRecommendation } from '../utils/chartRecommendations';
import type { PieDatum } from '../../datasets/components/charts/PieChart';

interface ResultChartProps {
  result: DataMartQueryResult;
  height?: number;
}

/**
 * Renders the recommended chart for a query result. Falls back to a callout
 * when no chart makes sense (empty rows, single-row aggregate, no metric).
 */
export function ResultChart({ result, height = 320 }: ResultChartProps) {
  const recommendation: ChartRecommendation | null = recommendChart(result);

  if (!recommendation) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-sm font-medium text-white">No chart for this result</p>
        <p className="mt-1.5 max-w-sm text-sm text-slate-400">
          This result is either empty or a single aggregate value — the table view shows it best.
        </p>
      </div>
    );
  }

  const xKey = recommendation.xKey!;
  const yKey = recommendation.yKey!;

  if (recommendation.kind === 'line') {
    return <LineChart data={result.rows} xKey={xKey} yKey={yKey} height={height} />;
  }

  if (recommendation.kind === 'bar') {
    return (
      <BarChart
        data={result.rows}
        xKey={xKey}
        yKey={yKey}
        horizontal={recommendation.horizontal}
        height={height}
      />
    );
  }

  if (recommendation.kind === 'pie') {
    const pieData: PieDatum[] = result.rows
      .map((row) => ({
        name: String(row[xKey] ?? ''),
        value: typeof row[yKey] === 'number' ? (row[yKey] as number) : Number(row[yKey]) || 0,
      }))
      .filter((entry) => entry.name && Number.isFinite(entry.value));
    return <PieChart data={pieData} height={height} />;
  }

  // scatter
  const scatterData = result.rows
    .map((row) => ({
      x: typeof row[xKey] === 'number' ? (row[xKey] as number) : Number(row[xKey]) || 0,
      y: typeof row[yKey] === 'number' ? (row[yKey] as number) : Number(row[yKey]) || 0,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  return <ScatterChart data={scatterData} xName={xKey} yName={yKey} height={height} />;
}

export function recommendChartFor(result: DataMartQueryResult): ChartRecommendation | null {
  return recommendChart(result);
}