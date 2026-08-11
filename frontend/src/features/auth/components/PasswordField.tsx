import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '../../../components/ui/Input';
import { EyeIcon, EyeOffIcon } from '../../landing/components/icons';

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

/** Password input with a visibility toggle. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label = 'Password', error, ...rest }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        label={label}
        type={visible ? 'text' : 'password'}
        autoComplete={rest.autoComplete ?? 'current-password'}
        error={error}
        endAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded-md p-1 text-slate-400 transition hover:text-slate-200"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        }
        {...rest}
      />
    );
  },
);
