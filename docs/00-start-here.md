# Start here: backend systems and current implementation

A backend receives an HTTP request, validates it, identifies the caller when necessary, applies product rules, reads or changes data, and returns an HTTP response.

```text
Browser or mobile client
→ LedgerCraft API
→ Supabase Auth and PostgreSQL
→ JSON response
```

LedgerCraft is intended to become a modular monolith: one deployable Node.js API organised into focused route, configuration, module, and database areas. It is not a microservice system.

## Current checkpoint

| Area | Status |
| --- | --- |
| Environment validation | **Exists already** in `src/config/env.ts`. |
| Application error type | **Exists already** in `src/lib/app-error.ts`. |
| Bearer-token parsing | **Exists already** in `src/modules/bearer-token.ts`. |
| Shared auth/workspace types | **Exists already** in `src/modules/types.ts`; they are declarations only and are not connected to Supabase yet. |
| Health-route definition | **Exists already** in `src/routes/health.ts`; it is not exported or registered, so it is not reachable over HTTP. |
| Fastify application | **Will be implemented soon after Application foundation.** `src/app.ts` exists but is empty. |
| Running server | **Will be implemented soon after Application foundation.** `src/server.ts` exists but is empty. |
| Route tests | **Will be implemented soon after Application foundation.** `src/app.test.ts` exists but is empty. |
| Supabase database schema and RLS | **Will be implemented soon after Database security.** |

## Terms to learn first

| Term | Meaning in LedgerCraft |
| --- | --- |
| Route | Code that handles one method and path, for example `GET /health`. |
| Request | Data sent to the API by a client. |
| Response | Status code and data returned by the API. |
| Authentication | Proving who a caller is. Supabase Auth will do this. |
| Authorization | Deciding what that authenticated caller may do. Roles and database rules will do this. |
| Migration | A version-controlled SQL file that changes database structure or rules. |
| Test | Executable code that proves expected behaviour. |

## Reading order

1. Read [Current codebase map](10-codebase-map.md).
2. Read [Application foundation](01-application-foundation.md).
3. Read [Validation and errors](02-validation-and-errors.md).
4. Read [Authentication](03-authentication.md) and [Workspaces and roles](04-workspaces-and-roles.md).
5. Read [SQL basics](15-sql-basics.md), [Database security](05-database-security.md), and [Docker and local Supabase](06-docker-and-local-supabase.md).
6. Use [Glossary](08-glossary.md), [Security baseline](11-security-baseline.md), and [Frontend perspective](13-frontend-perspective.md) as reference material.

The later documents deliberately explain the full backend destination. Their checkpoint labels distinguish code that exists from work that will be implemented soon after a named stage.
