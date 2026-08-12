import type { ComponentType } from 'react';
import { formatNumber } from '../../../../utils/format';

/** Categorical palette used across all charts (brutalist, high contrast). */
export const CHART_COLORS = [
  '#C6FF00', // Lime
  '#FF4D8D', // Pink
  '#FFD600', // Yellow
  '#FFFFFF', // White
  '#00F0FF', // Cyan
  '#FF00FF', // Magenta
  '#FF8A00', // Orange
  '#00E575', // Light green
  '#0066FF', // Blue
  '#A3A3A3', // Gray
];

export const CHART_AXIS = {
  stroke: 'rgba(255, 255, 255, 0.3)',
  tick: { fill: '#A3A3A3', fontSize: 10, fontWeight: 'bold' },
};

export const CHART_GRID = {
  stroke: 'rgba(255, 255, 255, 0.1)',
  vertical: false,
};

/** Formats a raw value for chart axes/tooltips without losing precision. */
export function formatChartValue(value: unknown): string {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return formatNumber(value);
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface TooltipPayloadItem {
  name?: string | number;
  value?: unknown;
  color?: string;
  fill?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  formatter?: (value: unknown) => string;
}

/** Reusable recharts tooltip styled for the brutalist theme. */
export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-2 border-white bg-ink-card px-3 py-2.5 text-xs font-bold uppercase tracking-wider shadow-brutal-sm rounded-sm">
      {label !== undefined && label !== '' ? (
        <p className="mb-2 border-b border-white/20 pb-1.5 text-white">{String(label)}</p>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const color = item.color ?? item.fill;
          const raw = item.value;
          const name = item.name ?? item.dataKey;
          return (
            <p key={index} className="flex items-center gap-2 text-white">
              {color ? (
                <span className="h-2 w-2 shrink-0 border border-white" style={{ background: color }} />
              ) : null}
              <span className="truncate text-muted">{String(name ?? '')}:</span>
              <span className="ml-auto pl-3 font-black text-white">
                {formatter ? formatter(raw) : formatChartValue(raw)}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

export type ChartIconType = ComponentType<{ className?: string }>;
