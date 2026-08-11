import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError } from '../../../lib/api';
import { AuthShell } from '../components/AuthShell';
import { ErrorBanner } from '../components/ErrorBanner';
import { PasswordField } from '../components/PasswordField';

interface FieldErrors {
  email?: string;
  password?: string;
}

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<{
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const nextFieldErrors: FieldErrors = {};
    if (!email.trim()) nextFieldErrors.email = 'Email is required';
    if (!password) nextFieldErrors.password = 'Password is required';

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      navigate(from, { replace: true });
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
      title="Sign in"
      subtitle="Access your Enterprise Intelligence workspace."
      footer={
        <>
          New to PS-05?{' '}
          <Link to="/signup" className="font-medium text-cyan-400 hover:text-cyan-300">
            Create an account
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
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />
        </div>

        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
          Sign In
        </Button>
      </form>
    </AuthShell>
  );
}
