# Current codebase map

This map distinguishes files that exist now from the next implementation stages. It is the authoritative description of the repository’s current state.

## Files that exist already

```text
src/
├── config/env.ts                 # validates environment values
├── lib/app-error.ts              # application error type
├── modules/bearer-token.ts       # parses Bearer tokens
├── modules/types.ts              # shared future-facing contracts
├── routes/health.ts              # defines GET /health, not exported yet
├── app.ts                        # empty
├── server.ts                     # empty
├── app.test.ts                   # empty
└── routes/auth.ts                # empty
```

`package.json`, `tsconfig.json`, `.env.example`, and the product-design documents also exist already.

## What each existing file means

| File | Status | Responsibility |
| --- | --- | --- |
| `src/config/env.ts` | **Exists already** | Uses Zod to parse expected configuration values. |
| `src/lib/app-error.ts` | **Exists already** | Represents an expected error with an HTTP status and stable code. |
| `src/modules/bearer-token.ts` | **Exists already** | Rejects a missing or malformed `Authorization: Bearer <token>` header. It does not verify the token with Supabase. |
| `src/modules/types.ts` | **Exists already** | Names intended auth, profile, workspace, and membership values. These interfaces do not create behaviour by themselves. |
| `src/routes/health.ts` | **Exists already** | Declares a health handler, but it must be exported and registered before clients can call it. |
| `src/app.ts` | **Will be implemented soon after Application foundation.** | It will create Fastify, register shared behaviour and routes, and return the application for tests. |
| `src/server.ts` | **Will be implemented soon after Application foundation.** | It will call the app factory and listen on `env.PORT`. |
| `src/app.test.ts` | **Will be implemented soon after Application foundation.** | It will call Fastify’s in-memory `app.inject()` method to test `GET /health`. |
| `src/routes/auth.ts` | **Will be implemented soon after Authentication.** | It will validate authentication requests and call a Supabase gateway. |

## Planned target structure

The following structure is not present yet. Each folder will be created only when its named feature is implemented.

```text
src/
├── config/                       # environment values and small policy values
├── lib/                          # small shared helpers
├── modules/                      # Supabase boundary and product modules
├── routes/                       # HTTP route groups and focused tests
├── app.ts                        # Fastify application factory
├── server.ts                     # process entry point
└── register-routes.ts            # one visible route-registration list
supabase/
├── config.toml                   # local Supabase configuration
├── migrations/                   # ordered SQL changes
└── tests/database/               # pgTAP migration and RLS tests
```

## Build sequence

1. **Application foundation** — expose and register health, add app/server assembly, and make the first test pass.
2. **Validation and errors** — create a single JSON error response shape before adding input-heavy routes.
3. **Supabase foundation** — add local configuration, migrations, profiles, workspaces, memberships, and RLS tests.
4. **Authentication** — connect sign-up, sign-in, recovery, sign-out, password update, and current-user routes to Supabase.
5. **Workspaces and roles** — implement organisation creation and Admin-controlled membership.
6. **Security and operations** — add rate limiting, security headers, Storage rules, CI, and deployment configuration when their requirements are defined.
