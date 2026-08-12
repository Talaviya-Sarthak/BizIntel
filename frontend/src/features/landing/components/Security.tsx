import { KeyIcon, LockIcon, ShieldIcon, DatabaseIcon, CheckIcon } from './icons';

const SECURITY_ITEMS = [
  {
    icon: LockIcon,
    title: 'Secure authentication',
    description: 'Credentials hashed with bcrypt — plaintext passwords are never stored.',
  },
  {
    icon: KeyIcon,
    title: 'JWT-based authorization',
    description: 'Signed, expiring access tokens in HTTP-only cookies with centralized auth middleware.',
  },
  {
    icon: ShieldIcon,
    title: 'Server-side validation',
    description: 'Every request is validated at the API boundary with strict schemas.',
  },
  {
    icon: DatabaseIcon,
    title: 'PostgreSQL persistence',
    description: 'All account data persisted in Neon PostgreSQL with schema-managed migrations.',
  },
] as const;

const IMPLEMENTED = [
  'Environment-based secrets',
  'HTTP security headers',
  'CORS allow-list',
  'Rate limiting on auth endpoints',
  'Structured, redacted logging',
  'Consistent API error contracts',
];

export function Security() {
  return (
    <section id="security" className="relative py-16 sm:py-24 border-t border-zinc-800/80">
      <div className="container-shell">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {SECURITY_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4.5"
              >
                <div className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-xs font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
              Security
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              Security engineered into the foundation
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              PS-05 applies production security practices from the first line of
              code. These controls are implemented today — not aspirational.
            </p>

            <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {IMPLEMENTED.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
