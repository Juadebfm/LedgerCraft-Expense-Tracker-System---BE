# LedgerCraft backend

LedgerCraft is a Node.js and TypeScript backend for a personal and organisation expense-tracking product. It uses Fastify for HTTP, Supabase for authentication and PostgreSQL, and SQL migrations for database rules.

## Current status

The project foundation exists, but no HTTP application is assembled yet. The health-route definition, environment validation, application-error type, bearer-token parser, and shared domain types are present. The application entry point, server entry point, authentication routes, and tests will be implemented next.

Read [Start here](docs/00-start-here.md) before running or changing code. [Current codebase map](docs/10-codebase-map.md) is the source of truth for what currently exists.

## Commands

```bash
npm ci
npm run typecheck
npm run build
```

`npm test` is configured but currently fails because `src/app.test.ts` contains no test suite. Do not interpret a passing build as proof that an API server is running; `src/app.ts` and `src/server.ts` do not contain application code yet.

Later checkpoints will add these local-database commands:

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run supabase:stop
```

`db:reset` will recreate the local database. It must never be used against a database containing data that needs to be kept.

## Documentation map

1. [Start here](docs/00-start-here.md)
2. [Application foundation](docs/01-application-foundation.md)
3. [Validation and errors](docs/02-validation-and-errors.md)
4. [Authentication](docs/03-authentication.md)
5. [Workspaces and roles](docs/04-workspaces-and-roles.md)
6. [Database security](docs/05-database-security.md)
7. [Docker and local Supabase](docs/06-docker-and-local-supabase.md)
8. [Backend architecture](docs/07-backend-architecture.md)
9. [Glossary](docs/08-glossary.md)
10. [Engineering decisions](docs/09-engineering-decisions.md)
11. [Current codebase map](docs/10-codebase-map.md)
12. [Security baseline](docs/11-security-baseline.md)
13. [Current API map](docs/12-current-api-map.md)
14. [Frontend perspective](docs/13-frontend-perspective.md)
15. [Product roadmap](docs/14-product-roadmap.md)
16. [SQL basics](docs/15-sql-basics.md)

The existing [MVP architecture guide](docs/mvp-archi.md) describes the intended product. It is not a statement that the described routes, tables, or integrations exist today.
