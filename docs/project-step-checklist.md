# Implementation checklist

Use [Current codebase map](10-codebase-map.md) for the exact current state and [Product roadmap](14-product-roadmap.md) for the ordered implementation stages.

The completed foundation items are environment validation, package configuration, strict TypeScript configuration, the application error type, bearer-token parsing, shared type declarations, and a health-route definition.

**Will be implemented soon after the current checkpoint:** application foundation will export and register the health route, assemble Fastify in `src/app.ts`, start the process from `src/server.ts`, and add a real `app.inject()` test.
