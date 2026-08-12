import { Checkbox } from '../../../components/ui/checkbox';
import { DatabaseIcon, AlertIcon } from '../../../components/ui/icons';
import type { QueryDatasetSource } from '../types';
import { useDataMartDatasets } from '../hooks/useDataMartOverview';

interface DataSourceSelectorProps {
  sources: QueryDatasetSource[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function DataSourceSelector({ sources, selected, onChange }: DataSourceSelectorProps) {
  const datasetsQuery = useDataMartDatasets();
  const total = datasetsQuery.data?.total ?? sources.length;

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-col gap-2">
      {sources.length === 0 ? (
        <p className="flex items-start gap-2 text-xs text-amber-300">
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          No ready datasets available. Upload a dataset and wait for processing.
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
                      ? 'flex cursor-pointer items-start gap-3 rounded-xl border border-white/40 bg-zinc-800/90 p-3 transition-all shadow-xs'
                      : 'flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] bg-[#141414] p-3 transition-all hover:border-white/20'
                  }
                >
                  <Checkbox
                    id={`dataset-${source.id}`}
                    checked={active}
                    onCheckedChange={() => toggle(source.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <DatabaseIcon className="h-3.5 w-3.5 shrink-0 text-zinc-200" />
                      <span className="truncate text-xs font-semibold text-zinc-100">{source.name}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-400 font-mono">
                      {source.columns.length} column{source.columns.length === 1 ? '' : 's'}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-zinc-400">
        {total} dataset{total === 1 ? '' : 's'} in library · {sources.length} ready · up to 8 per query
      </p>
    </div>
  );
}