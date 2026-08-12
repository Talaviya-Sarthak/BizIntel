import type { ComponentType } from 'react';
import { formatNumber } from '../../../../utils/format';

/** Categorical palette used across all charts (light on dark theme). */
export const CHART_COLORS = [
  '#22d3ee',
  '#34d399',
  '#a78bfa',
  '#fbbf24',
  '#f472b6',
  '#60a5fa',
  '#fb7185',
  '#4ade80',
  '#c084fc',
  '#f97316',
];

export const CHART_AXIS = {
  stroke: 'rgba(148,163,184,0.4)',
  tick: { fill: '#64748b', fontSize: 11 },
};

export const CHART_GRID = {
  stroke: 'rgba(255,255,255,0.06)',
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

/** Reusable recharts tooltip styled for the dark theme. */
export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-xs shadow-2xl">
      {label !== undefined && label !== '' ? (
        <p className="mb-1.5 font-semibold text-white">{String(label)}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const color = item.color ?? item.fill;
          const raw = item.value;
          const name = item.name ?? item.dataKey;
          return (
            <p key={index} className="flex items-center gap-2 text-slate-300">
              {color ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
              ) : null}
              <span className="truncate">{String(name ?? '')}</span>
              <span className="ml-auto pl-3 font-medium text-white">
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
