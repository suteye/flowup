# Pixel Cat Office

A Next.js App Router task management app with OAuth login, workspace onboarding, spaces, tasks, subtasks, assignees, due dates, invites, light/dark themes, and Telegram/LINE notification settings.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill in `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, and OAuth provider credentials.
3. Run the database migration:

```bash
pnpm db:migrate
```

4. Start the app:

```bash
pnpm dev
```

Open the exact URL printed by Next.js, usually [http://localhost:3000](http://localhost:3000).

## Google OAuth Redirect URI

Google requires an exact redirect URI match. If Next.js prints:

```txt
Local: http://localhost:3001
```

then Google Cloud Console must include this Authorized redirect URI:

```txt
http://localhost:3001/api/auth/callback/google
```

If you run on port `3000`, use:

```txt
http://localhost:3000/api/auth/callback/google
```

Keep `.env` aligned with the same origin:

```bash
NEXTAUTH_URL="http://localhost:3001"
AUTH_URL="http://localhost:3001"
```

Use `localhost` consistently. Do not mix `localhost` and `127.0.0.1` unless both redirect URIs are registered in Google Cloud Console.

## Useful Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:generate
pnpm db:migrate
```
