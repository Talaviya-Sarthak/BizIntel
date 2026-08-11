/** Formats a byte count as a human-readable size. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

/** Formats a row count with thousand separators. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-US');
}

/** Formats an ISO timestamp as a compact local date, e.g. `Aug 11, 2026`. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Formats an ISO timestamp as a relative time, e.g. `3 days ago`. */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const units: [number, string][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86_400, 'hour'],
    [604_800, 'day'],
    [2_592_000, 'week'],
    [31_536_000, 'month'],
    [315_360_000, 'year'],
  ];

  for (let i = units.length - 1; i >= 0; i -= 1) {
    const [size, label] = units[i]!;
    if (abs >= size) {
      const count = Math.round(abs / size);
      return `${count} ${label}${count === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

/** First two initials of a person's name, uppercased. */
export function initialsOf(name: string | null | undefined): string {
  return (name ?? 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
