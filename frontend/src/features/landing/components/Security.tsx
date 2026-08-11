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
    <section id="security" className="relative py-20 sm:py-28">
      <div className="container-shell">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {SECURITY_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div>
            <span className="section-label">Security</span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Security engineered into the foundation
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              PS-05 applies production security practices from the first line of
              code. These controls are implemented today — not aspirational.
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {IMPLEMENTED.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/25">
                    <CheckIcon className="h-3 w-3" />
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
