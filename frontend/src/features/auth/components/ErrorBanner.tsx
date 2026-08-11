interface FieldError {
  field: string;
  message: string;
}

interface ErrorBannerProps {
  message: string;
  code?: string;
  details?: FieldError[];
}

export function ErrorBanner({ message, code, details }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3"
    >
      <p className="text-sm font-medium text-red-300">{message}</p>
      {code ? <p className="mt-0.5 font-mono text-[11px] text-red-400/70">{code}</p> : null}
      {details && details.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1 border-t border-red-500/20 pt-2">
          {details.map((detail) => (
            <li key={detail.field} className="text-xs text-red-300/90">
              {detail.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
