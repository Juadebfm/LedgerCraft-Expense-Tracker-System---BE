# LedgerCraft backend

LedgerCraft is a Node.js and TypeScript backend for a personal and organisation expense-tracking product. It uses Fastify for HTTP, Supabase for authentication and PostgreSQL, and SQL migrations for database rules.

## Current status

The HTTP application and server entry point exist. Authentication, profile, and workspace routes are registered in `src/register.routes.ts`. The root-level [OpenAPI file](openapi.json) documents the authentication routes that are available now.

Read [Start here](docs/00-start-here.md) for the background concepts; use the API specification alongside the route code for the current auth contract.

## Commands

```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

Copy `.env.example` to `.env` and fill in the required values before starting the server. Do not commit `.env` or put Supabase keys into Postman requests.

Local-database commands:

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run supabase:stop
```

`db:reset` will recreate the local database. It must never be used against a database containing data that needs to be kept.

## Try authentication in Postman

1. Start the backend with `npm run dev`.
2. In Postman, choose **Import** and select the root-level `openapi.json` file.
3. The imported requests use `http://localhost:3000` by default. Change the base URL if your `PORT` is different.
4. Start with **Sign up** or **Sign in**. For **Sign out** and **Update password**, set Bearer Token authorization to the `session.accessToken` returned by sign-in.

Sign-up and password recovery can send real emails. Use an address you control for manual testing. A `204` response has no body; Postman should not expect JSON from sign-out or password update.

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
