const TOKEN_KEY = 'bizintel_auth_token';

export function getAccessToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log(`[authToken] getAccessToken() => ${token ? 'FOUND (length=' + token.length + ')' : 'NULL'}`);
    return token;
  } catch (e) {
    console.error('[authToken] getAccessToken() threw:', e);
    return null;
  }
}

export function setAccessToken(token: string | undefined | null): void {
  try {
    console.log('[authToken] setAccessToken() called with:', token ? `token (length=${token.length}, starts=${token.substring(0, 20)}...)` : token);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      console.log('[authToken] localStorage.setItem confirmed. Now reads back:', localStorage.getItem(TOKEN_KEY) ? 'OK' : 'EMPTY');
    } else {
      localStorage.removeItem(TOKEN_KEY);
      console.log('[authToken] token falsy, removed from localStorage');
    }
  } catch (e) {
    console.error('[authToken] setAccessToken() threw:', e);
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
