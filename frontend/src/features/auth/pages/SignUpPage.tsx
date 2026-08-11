import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError } from '../../../lib/api';
import { AuthShell } from '../components/AuthShell';
import { ErrorBanner } from '../components/ErrorBanner';
import { PasswordField } from '../components/PasswordField';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<{
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const next: FieldErrors = {};

    if (name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      next.password = 'Password must include uppercase, lowercase, and a number';
    }
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      setFormError({
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
      });
      if (apiError.details) {
        const mapped: FieldErrors = {};
        for (const detail of apiError.details) {
          if (detail.field === 'name') mapped.name = detail.message;
          if (detail.field === 'email') mapped.email = detail.message;
          if (detail.field === 'password') mapped.password = detail.message;
        }
        setFieldErrors(mapped);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building your intelligence workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError ? (
          <ErrorBanner
            message={formError.message}
            code={formError.code}
            details={formError.details}
          />
        ) : null}

        <Input
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Alex Morgan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Must include an uppercase letter, a lowercase letter, and a digit.
          </p>
        </div>

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
          Create Account
        </Button>
      </form>
    </AuthShell>
  );
}
