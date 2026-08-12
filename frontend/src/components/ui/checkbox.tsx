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
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-white bg-black text-black cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime peer-disabled:cursor-not-allowed peer-disabled:opacity-50 data-[state=checked]:bg-lime data-[state=checked]:text-black',
            className
          )}
        >
          {isChecked && <Check className="h-4.5 w-4.5 stroke-[3.5]" />}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
