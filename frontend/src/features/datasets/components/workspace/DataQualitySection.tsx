import { clsx } from 'clsx';
import type { ComponentType } from 'react';
import { AlertIcon, CheckCircleIcon, XCircleIcon, LayersIcon } from '../../../../components/ui/icons';
import { useDatasetQuality } from '../../hooks/useDatasetAnalytics';
import type { QualityColumnRow } from '../../analytics/types';
import { formatNumber } from '../../../../utils/format';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';

interface DataQualitySectionProps {
  datasetId: string;
}

function qualityTone(quality: QualityColumnRow['quality']) {
  switch (quality) {
    case 'Excellent':
      return { badge: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30', bar: 'bg-emerald-400' };
    case 'Good':
      return { badge: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/30', bar: 'bg-cyan-400' };
    case 'Fair':
      return { badge: 'bg-amber-400/10 text-amber-300 ring-amber-400/30', bar: 'bg-amber-400' };
    case 'Poor':
      return { badge: 'bg-red-400/10 text-red-300 ring-red-400/30', bar: 'bg-red-400' };
  }
}

/** Per-column data quality grid plus overall summary tiles. */
export function DataQualitySection({ datasetId }: DataQualitySectionProps) {
  const qualityQuery = useDatasetQuality(datasetId);
  const quality = qualityQuery.data;

  if (qualityQuery.isLoading) {
    return <SkeletonTable rows={6} cols={6} />;
  }

  if (qualityQuery.isError || !quality) {
    return (
      <ErrorState
        message={qualityQuery.error?.message ?? 'Could not load data quality.'}
        onRetry={() => qualityQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile
          icon={XCircleIcon}
          label="Missing values"
          value={`${formatNumber(quality.missingValues)}`}
          detail={`${quality.missingPercent.toFixed(1)}% of cells`}
          tone="warning"
        />
        <SummaryTile
          icon={LayersIcon}
          label="Duplicate rows"
          value={`${formatNumber(quality.duplicateRows)}`}
          detail={`${quality.duplicatePercent.toFixed(1)}% of rows`}
          tone="warning"
        />
        <SummaryTile
          icon={AlertIcon}
          label="Invalid values"
          value={`${formatNumber(quality.invalidValues)}`}
          detail={`${quality.invalidPercent.toFixed(1)}% of cells`}
          tone="bad"
        />
        <SummaryTile
          icon={CheckCircleIcon}
          label="Type consistency"
          value={`${quality.typeConsistency.toFixed(0)}%`}
          detail="of values match column type"
          tone="good"
        />
      </div>

      <section aria-label="Column quality" className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Column quality</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Missing, unique and invalid share per column.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Column</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Missing</th>
                <th className="px-5 py-3 font-medium">Unique</th>
                <th className="px-5 py-3 font-medium">Invalid</th>
                <th className="px-5 py-3 font-medium">Completeness</th>
                <th className="px-5 py-3 text-right font-medium">Quality</th>
              </tr>
            </thead>
            <tbody>
              {quality.columns.map((row) => {
                const tone = qualityTone(row.quality);
                const completeness = Math.max(0, 100 - row.missingPct);
                return (
                  <tr key={row.column} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="max-w-[220px] truncate px-5 py-3 font-medium text-white" title={row.column}>
                      {row.column}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{row.type}</td>
                    <td className="px-5 py-3 text-slate-300">
                      {formatNumber(row.missing)}
                      <span className="ml-1.5 text-xs text-slate-500">{row.missingPct.toFixed(1)}%</span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {formatNumber(row.unique)}
                      <span className="ml-1.5 text-xs text-slate-500">{row.uniquePct.toFixed(0)}%</span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{formatNumber(row.invalid)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={clsx('h-full rounded-full', tone.bar)}
                            style={{ width: `${Math.min(100, completeness)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{completeness.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1', tone.badge)}>
                        {row.quality}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

interface SummaryTileProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warning' | 'bad';
}

function SummaryTile({ icon: Icon, label, value, detail, tone }: SummaryTileProps) {
  const tones = {
    good: 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20',
    warning: 'text-amber-400 bg-amber-400/10 ring-amber-400/20',
    bad: 'text-red-400 bg-red-400/10 ring-red-400/20',
  } as const;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <span className={clsx('inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1', tones[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
