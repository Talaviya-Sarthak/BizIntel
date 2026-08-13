import { Input } from '../../../components/ui/Input';
import type { ParameterDef } from '../types';

interface ParameterFieldsProps {
  parameters: ParameterDef[];
  values: Record<string, number | boolean>;
  onChange: (name: string, value: number | boolean) => void;
}

/** Dynamic strategy-parameter form rendered from the strategy's ParameterDefs. */
export function ParameterFields({ parameters, values, onChange }: ParameterFieldsProps) {
  if (parameters.length === 0) {
    return <p className="text-sm text-slate-500">This strategy has no parameters.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {parameters.map((def) => {
        const current = values[def.name] ?? def.default;
        if (def.type === 'boolean') {
          return (
            <label
              key={def.name}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span>
                <span className="block text-sm font-medium text-slate-200">{def.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{def.description}</span>
              </span>
              <input
                type="checkbox"
                checked={current === true}
                onChange={(event) => onChange(def.name, event.target.checked)}
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
          );
        }

        const min = def.min;
        const max = def.max;
        const step = def.step ?? (def.type === 'integer' ? 1 : 0.1);

        return (
          <Input
            key={def.name}
            id={`param-${def.name}`}
            label={def.label}
            type="number"
            value={typeof current === 'number' ? String(current) : String(def.default)}
            min={min}
            max={max}
            step={step}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) onChange(def.name, def.type === 'integer' ? Math.round(parsed) : parsed);
            }}
            error={undefined}
          />
        );
      })}
    </div>
  );
}
