# Engineering decisions

This document records choices that exist already and intended choices that will be implemented at named checkpoints.

## Exists already: TypeScript with strict checking

`tsconfig.json` enables strict TypeScript options. This makes missing values, invalid optional-property use, and incompatible data shapes visible before runtime.

## Exists already: Fastify and Zod dependencies

Fastify and Zod are installed. Fastify will provide application and route registration; Zod already validates environment values in `src/config/env.ts` and will validate HTTP input later.

## Will be implemented soon after Application foundation: app factory

The API will expose a `buildApp()` function. The process entry point and in-memory tests will use the same assembled routes, preventing tests from exercising a different implementation than the running server.

## Will be implemented soon after Authentication: Supabase owns credentials

Supabase Auth will own password hashes, recovery tokens, and sessions. LedgerCraft will own profiles, workspaces, roles, and product rules. A second password database will not be created.

## Will be implemented soon after Supabase foundation: caller-scoped access and RLS

Protected database operations will pass the incoming access token to Supabase. PostgreSQL RLS will independently limit rows by caller. Server-only actions will require explicit authorization checks and a secret key that never reaches a browser.

## Will be implemented soon after Security baseline: shared rate-limit state

If the API scales horizontally, rate-limit counters must live in a shared store. Per-process memory is only correct for one local instance.
