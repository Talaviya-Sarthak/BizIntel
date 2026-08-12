import { Checkbox } from '../../../components/ui/checkbox';
import { DatabaseIcon, AlertIcon } from '../../../components/ui/icons';
import type { QueryDatasetSource } from '../types';
import { useDataMartDatasets } from '../hooks/useDataMartOverview';

interface DataSourceSelectorProps {
  sources: QueryDatasetSource[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * Multi-select of READY datasets plus a summary of total datasets.
 * Columns are derived from schemas (owned by DataMart so the builder does
 * not depend on the datasets workspace).
 */
export function DataSourceSelector({ sources, selected, onChange }: DataSourceSelectorProps) {
  const datasetsQuery = useDataMartDatasets();
  const total = datasetsQuery.data?.total ?? sources.length;

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-col gap-2">
      {sources.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-slate-400">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          No ready datasets yet. Upload a dataset and wait for it to finish processing first.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {sources.map((source) => {
            const active = selected.includes(source.id);
            return (
              <li key={source.id}>
                <label
                  className={
                    active
                      ? 'flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.05] p-3 transition'
                      : 'flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/25'
                  }
                >
                  <Checkbox
                    id={`dataset-${source.id}`}
                    checked={active}
                    onCheckedChange={() => toggle(source.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <DatabaseIcon className="h-4 w-4 shrink-0 text-cyan-400" />
                      <span className="truncate text-sm font-medium text-white">{source.name}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {source.columns.length} column{source.columns.length === 1 ? '' : 's'}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-slate-600">
        {total} dataset{total === 1 ? '' : 's'} in your library · {sources.length} ready · up to 8
        per query
      </p>
    </div>
  );
}