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
      return { badge: 'border-2 border-lime text-lime bg-lime/10', bar: 'bg-lime' };
    case 'Good':
      return { badge: 'border-2 border-lime text-lime bg-lime/10', bar: 'bg-lime' };
    case 'Fair':
      return { badge: 'border-2 border-yellow text-yellow bg-yellow/10', bar: 'bg-yellow' };
    case 'Poor':
      return { badge: 'border-2 border-pink text-pink bg-pink/10', bar: 'bg-pink' };
  }
}

/** Per-column data quality grid plus overall summary tiles. */
export function DataQualitySection({ datasetId }: DataQualitySectionProps) {
  const qualityQuery = useDatasetQuality(datasetId);
  const quality = qualityQuery.data;

  if (qualityQuery.isLoading) {
    return (
      <div className="bg-black">
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
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
    <div className="flex flex-col gap-6 bg-black">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 bg-black">
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

      <section aria-label="Column quality" className="overflow-hidden border-2 border-white bg-black shadow-brutal rounded-md">
        <div className="border-b-2 border-white px-5 py-4 bg-ink-soft">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Column quality</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">
            Missing, unique and invalid share per column.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold uppercase tracking-wider">
            <thead>
              <tr className="border-b-2 border-white bg-ink-soft text-[10px] text-white">
                <th className="px-5 py-3.5 font-bold">Column</th>
                <th className="px-5 py-3.5 font-bold">Type</th>
                <th className="px-5 py-3.5 font-bold">Missing</th>
                <th className="px-5 py-3.5 font-bold">Unique</th>
                <th className="px-5 py-3.5 font-bold">Invalid</th>
                <th className="px-5 py-3.5 font-bold">Completeness</th>
                <th className="px-5 py-3.5 text-right font-bold">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y border-white/20 bg-black text-white">
              {quality.columns.map((row) => {
                const tone = qualityTone(row.quality);
                const completeness = Math.max(0, 100 - row.missingPct);
                return (
                  <tr key={row.column} className="transition-colors hover:bg-ink-card">
                    <td className="max-w-[220px] truncate px-5 py-4 font-bold text-white normal-case text-sm" title={row.column}>
                      {row.column}
                    </td>
                    <td className="px-5 py-4 text-muted font-mono">{row.type}</td>
                    <td className="px-5 py-4 text-white">
                      {formatNumber(row.missing)}
                      <span className="ml-1.5 text-xs text-muted font-bold font-mono">{row.missingPct.toFixed(1)}%</span>
                    </td>
                    <td className="px-5 py-4 text-white">
                      {formatNumber(row.unique)}
                      <span className="ml-1.5 text-xs text-muted font-bold font-mono">{row.uniquePct.toFixed(0)}%</span>
                    </td>
                    <td className="px-5 py-4 text-white font-mono">{formatNumber(row.invalid)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 w-20 overflow-hidden border border-white bg-black rounded-sm">
                          <div
                            className={clsx('h-full', tone.bar)}
                            style={{ width: `${Math.min(100, completeness)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted font-bold font-mono">{completeness.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={clsx('inline-flex px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm', tone.badge)}>
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
    good: 'text-lime bg-lime/10 border-lime',
    warning: 'text-yellow bg-yellow/10 border-yellow',
    bad: 'text-pink bg-pink/10 border-pink',
  } as const;

  return (
    <div className="border-2 border-white bg-ink-card p-5 shadow-brutal-sm rounded-md">
      <span className={clsx('inline-flex h-9 w-9 items-center justify-center border-2 rounded-sm', tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3.5 text-[9px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{detail}</p>
    </div>
  );
}
