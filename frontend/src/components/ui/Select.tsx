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
    <div className="w-full grid gap-1.5">
      {label ? (
        <label
          htmlFor={selectId}
          className="text-xs font-bold uppercase tracking-wider text-white"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={clsx(
            'w-full border-2 border-white bg-black px-3.5 py-2 text-sm text-white outline-none transition-all rounded-md appearance-none pr-10',
            'focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]',
            error && 'border-pink focus:border-pink focus:shadow-[4px_4px_0px_#FF4D8D]',
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled} className="bg-black text-white">
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-white">
          <ChevronDownIcon className="h-4.5 w-4.5" />
        </div>
      </div>
      {error ? (
        <p id={`${selectId}-error`} className="text-xs font-bold text-pink uppercase tracking-wider" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
