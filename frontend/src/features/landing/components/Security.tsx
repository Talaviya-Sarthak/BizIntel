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
    <section id="security" className="relative py-16 sm:py-24 border-t-2 border-white bg-black">
      <div className="container-shell">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {SECURITY_ITEMS.map((item) => (
              <div
                key={item.title}
                className="border-2 border-white bg-ink-card p-5 shadow-brutal-sm rounded-md"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center border-2 border-lime bg-lime/10 text-lime">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted font-medium">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-start">
            <span className="section-label">
              Security
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl uppercase">
              Security engineered into the foundation
            </h2>
            <p className="mt-3 text-sm font-bold uppercase tracking-wider text-muted leading-relaxed">
              PS-05 applies production security practices from the first line of code. These controls are implemented today — not aspirational.
            </p>

            <ul className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 w-full">
              {IMPLEMENTED.map((item) => (
                <li key={item} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-white">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center border border-lime text-lime bg-lime/10">
                    <CheckIcon className="h-3.5 w-3.5" />
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
