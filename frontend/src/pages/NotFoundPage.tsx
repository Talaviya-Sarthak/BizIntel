import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <Logo className="mb-8" />
      <p className="font-mono text-sm font-black text-pink uppercase tracking-widest">404</p>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-center text-xs font-bold uppercase tracking-wider text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="mt-8">
        <Button variant="outline">Back to home</Button>
      </Link>
    </div>
  );
}
