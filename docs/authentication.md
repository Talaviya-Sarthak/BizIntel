# Authentication

PS-05 uses **JWT-based authentication** with the access token delivered in an
**HTTP-only cookie**. Passwords are hashed with **bcrypt** (cost factor 10) and
never stored or transmitted in plaintext.

## Endpoints

| Method | Endpoint                | Auth | Behavior                              |
| ------ | ----------------------- | ---- | ------------------------------------- |
| POST   | `/api/v1/auth/register` | —    | Validate → normalize email → check duplicate → hash password → create user → set auth cookie |
| POST   | `/api/v1/auth/login`    | —    | Validate → compare hash → set auth cookie |
| POST   | `/api/v1/auth/logout`   | —    | Clear the auth cookie                 |
| GET    | `/api/v1/auth/me`       | JWT  | Return the authenticated user profile |

## Registration flow

1. **Validation** — Zod schema checks `name`, `email`, `password`
   (8–128 chars, must contain upper/lowercase and a digit).
2. **Normalization** — email is trimmed and lowercased (the DB additionally
   enforces a case-insensitive unique index).
3. **Duplicate check** — if an account exists, `409 AUTH_EMAIL_ALREADY_REGISTERED`.
4. **Hashing** — `bcrypt.hash(password, 10)`.
5. **Creation** — user row inserted; only the public profile is returned
   (`password_hash` never crosses the API boundary).
6. **Auto sign-in** — the new user receives an auth cookie immediately.

## Login flow

1. Validate input.
2. Look up the user by email. To avoid user enumeration via timing, bcrypt is
   still run against a dummy hash when the account does not exist.
3. If the hash does not match (or the user is missing): `401 AUTH_INVALID_CREDENTIALS`.
4. Disabled accounts get `403 AUTH_ACCOUNT_DISABLED`.
5. On success a JWT is signed and set as an HTTP-only cookie.

## JWT lifecycle

- **Signing**: `utils/jwt.ts` — payload `{ sub: userId }`, issuer `ps05-api`,
  audience `ps05-web`, expires per `JWT_EXPIRES_IN` (default `1h`).
- **Storage**: the token lives in an HTTP-only cookie
  (`secure` in production, `sameSite=lax`, path `/`). Client-side JS cannot
  read it, reducing XSS token-theft risk.
- **Verification**: the `authenticate` middleware reads the cookie (or an
  `Authorization: Bearer` header for API clients), verifies signature, issuer,
  audience, and expiry, then attaches `req.auth = { userId }`.
- **Current user**: `GET /auth/me` re-fetches the user from the database so
  role/status changes take effect immediately.
- **Logout**: clears the cookie. The JWT is stateless; document that a stolen
  token remains valid until expiry (see trade-offs below).

## Protected routes

Any route can be protected by mounting `authenticate`:

```ts
router.get('/me', authenticate, controller.me);
```

`req.auth.userId` is guaranteed to be present after `authenticate`; services
look up the fresh record rather than trusting the token claims beyond the id.

## Frontend flow

- `AuthProvider` owns session state. On mount it calls `GET /auth/me` and
  classifies status as `loading` / `authenticated` / `unauthenticated`.
- `useAuth()` exposes `user`, `status`, `signIn`, `signUp`, `signOut`.
- `ProtectedRoute` redirects unauthenticated users to `/signin`;
  `GuestRoute` redirects authenticated users away from `/signin` and `/signup`.
- After successful sign-in/sign-up the user lands on `/dashboard`.
- `authService` is the single API surface for auth calls; axios is configured
  with `withCredentials: true` so the cookie travels with requests.

## Security controls

- bcrypt password hashing (never plaintext, never logged)
- JWT with short expiry, explicit issuer/audience
- HTTP-only + Secure + SameSite cookie
- Strict rate limiting on auth endpoints (20 per 15 min) + global API limiter
- Zod validation at the API boundary (single error contract)
- `helmet` security headers; CORS restricted to `CORS_ORIGIN` allow-list
- Centralized error handler — no stack traces or DB internals in responses
- Structured logging with redaction of tokens, passwords, cookies
- Secrets only via environment variables; `.env*` is git-ignored
- Timing-equalized password checks reduce user enumeration

## Trade-offs & roadmap

The current design uses a **single stateless access token** — simple, secure
against XSS via cookies, and easy to reason about. Noted limitations and the
intended path for production hardening:

| Concern                     | Current state             | Future direction                    |
| --------------------------- | ------------------------- | ----------------------------------- |
| Token revocation / logout   | Client-side (cookie clear)| Server-side session store or refresh tokens |
| Long-lived sessions         | Token expires (1h)        | Refresh token rotation in HTTP-only cookies |
| Account recovery            | Not implemented           | Forgot/reset password flows         |
| Email verification          | Flag present (`email_verified`), no flow yet | Verification emails + token |
| OAuth / SSO                 | Not implemented           | Pluggable provider layer            |
| 2FA / TOTP                  | Not implemented           | Extension after email verification  |
| CSRF                        | Mitigated by SameSite + JSON API | Double-submit tokens for cookie-based mutation endpoints if same-site policy changes |

The schema already carries `email_verified`, `is_active`, and `role`, so these
features can be added without migrations to the core account model.
