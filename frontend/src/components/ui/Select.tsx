import { clsx } from 'clsx';
import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from './icons';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: Option[];
  error?: string;
}

export function Select({ label, options, error, className, id, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={clsx(
            'input-field appearance-none pr-9',
            error && 'border-red-500/60 focus:border-red-400/60 focus:ring-red-400/20',
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled} className="bg-surface-deep text-slate-200">
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
          <ChevronDownIcon className="h-4 w-4" />
        </div>
      </div>
      {error ? (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
