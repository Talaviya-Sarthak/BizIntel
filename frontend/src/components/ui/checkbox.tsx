import React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, id, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
      if (onCheckedChange) onCheckedChange(e.target.checked);
    };

    const isChecked = !!checked;

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={id}
          data-state={isChecked ? 'checked' : 'unchecked'}
          className={clsx(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-950 text-zinc-900 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-900',
            className
          )}
        >
          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
