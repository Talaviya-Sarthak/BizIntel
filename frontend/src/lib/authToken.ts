/** In-memory JWT token. Not persisted to localStorage for XSS safety. */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | undefined | null): void {
  accessToken = token ?? null;
}

export function clearAccessToken(): void {
  accessToken = null;
}
