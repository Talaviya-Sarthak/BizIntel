import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { TrashIcon, PlusIcon } from '../../../components/ui/icons';
import type { QueryDatasetSource } from '../types';
import type { JoinRow } from '../utils/queryBuilder';

function LinkIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden="true">
      <path d="M10 14a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.7 5.17" />
      <path d="M14 10a5 5 0 0 0-7.07 0l-2.83 2.83a5 5 0 0 0 7.07 7.07l2.12-2.12" />
    </svg>
  );
}

interface JoinsSectionProps {
  sources: QueryDatasetSource[];
  joins: JoinRow[];
  onChange: (next: JoinRow[]) => void;
}

export function JoinsSection({ sources, joins, onChange }: JoinsSectionProps) {
  function add() {
    const base = sources[0]?.id ?? '';
    const right = sources.find((source) => source.id !== base)?.id ?? '';
    onChange([
      ...joins,
      {
        id: `join-${Date.now()}`,
        type: 'inner',
        leftDataset: base,
        leftColumn: '',
        rightDataset: right,
        rightColumn: '',
      },
    ]);
  }

  function update(id: string, patch: Partial<JoinRow>) {
    onChange(joins.map((join) => (join.id === id ? { ...join, ...patch } : join)));
  }

  function remove(id: string) {
    onChange(joins.filter((join) => join.id !== id));
  }

  function columnOptions(datasetId: string) {
    const source = sources.find((entry) => entry.id === datasetId);
    return [
      { value: '', label: 'Select a column', disabled: true },
      ...(source?.columns ?? []).map((column) => ({ value: column.name, label: column.name })),
    ];
  }

  return (
    <div className="flex flex-col gap-3">
      {joins.length === 0 ? (
        <p className="text-xs text-zinc-400">
          No joins — the query reads from the first selected dataset only. Add joins to combine
          multiple datasets (common keys only).
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {joins.map((join) => (
            <div key={join.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#141414] p-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                  <LinkIcon className="h-3.5 w-3.5 text-zinc-400" />
                  Join Condition
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove join"
                  className="text-zinc-400 hover:text-red-400"
                  onClick={() => remove(join.id)}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                <Select
                  label="Type"
                  value={join.type}
                  onChange={(event) => update(join.id, { type: event.target.value as 'inner' | 'left' })}
                  options={[
                    { value: 'inner', label: 'Inner (matching rows only)' },
                    { value: 'left', label: 'Left (keep all base rows)' },
                  ]}
                  className="lg:w-52"
                />
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
                    <Select
                      label="Left dataset"
                      value={join.leftDataset}
                      onChange={(event) =>
                        update(join.id, { leftDataset: event.target.value, leftColumn: '' })
                      }
                      options={sources.map((source) => ({ value: source.id, label: source.name }))}
                    />
                    <Select
                      label="Left column"
                      value={join.leftColumn}
                      onChange={(event) => update(join.id, { leftColumn: event.target.value })}
                      options={columnOptions(join.leftDataset)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
                    <Select
                      label="Right dataset"
                      value={join.rightDataset}
                      onChange={(event) =>
                        update(join.id, { rightDataset: event.target.value, rightColumn: '' })
                      }
                      options={sources.map((source) => ({ value: source.id, label: source.name }))}
                    />
                    <Select
                      label="Right column"
                      value={join.rightColumn}
                      onChange={(event) => update(join.id, { rightColumn: event.target.value })}
                      options={columnOptions(join.rightDataset)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={add} className="self-start border-white/[0.08] bg-zinc-900 text-zinc-200">
        <PlusIcon className="h-3.5 w-3.5" />
        Add join
      </Button>
    </div>
  );
}