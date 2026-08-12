import { Input } from '../../../components/ui/Input';
import type { ParameterDef } from '../types';

interface ParameterFormProps {
  parameters: ParameterDef[];
  values: Record<string, number>;
  onChange: (name: string, value: number) => void;
  errors?: Record<string, string>;
}

export function ParameterForm({ parameters, values, onChange, errors }: ParameterFormProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {parameters.map((param) => (
        <div key={param.name} className="space-y-2">
          <Input
            id={`param-${param.name}`}
            type="number"
            label={param.label}
            value={values[param.name] ?? param.default}
            min={param.min}
            max={param.max}
            step={param.step}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange(param.name, val);
            }}
            error={errors?.[param.name]}
          />
          <p className="text-[11px] text-slate-500">
            {param.description}
            <span className="ml-1 text-slate-600">
              ({param.min}–{param.max})
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
