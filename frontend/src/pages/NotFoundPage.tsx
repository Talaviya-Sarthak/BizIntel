import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-deep px-6">
      <Logo className="mb-8" />
      <p className="font-mono text-sm text-cyan-400">404</p>
      <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-slate-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="mt-8">
        <Button variant="outline">Back to home</Button>
      </Link>
    </div>
  );
}
