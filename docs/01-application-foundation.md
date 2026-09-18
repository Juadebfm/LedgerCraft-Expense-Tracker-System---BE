# Application foundation

## Goal

Create one real endpoint:

```text
GET /health → { "status": "ok" }
```

This endpoint proves that the process is listening and Fastify can receive a request. It does not query Supabase or require a bearer token.

## Current checkpoint

`src/routes/health.ts` **exists already** and defines the handler. It is not exported, so `src/app.ts` cannot register it yet. `src/app.ts`, `src/server.ts`, and `src/app.test.ts` exist but have no implementation.

## Will be implemented soon after Application foundation

1. Export the health route plugin.
2. Create `buildApp()` in `src/app.ts`.
3. Register the health route in that application.
4. Start the application from `src/server.ts` using `env.PORT`.
5. Test the real route with `app.inject()`.

The intended request path is:

```text
src/server.ts starts the process
→ src/app.ts creates Fastify
→ src/routes/health.ts registers GET /health
→ app.inject() sends an in-memory request in a test
```

`app.inject()` is useful because it exercises the actual Fastify route without opening a network port. A route test should check the response status and JSON body.

## Configuration

`src/config/env.ts` **exists already**. It parses `PORT`, `CORS_ORIGIN`, Supabase values, and later feature configuration. `NODE_ENV` currently has no default, so a future runnable `.env` file must set it to `development`, `test`, or `production`.

## Frontend perspective

A React application will not normally show `/health` to an end user. Deployment platforms, uptime checks, and developers use it to decide whether the API is reachable.

## Exercise

After this checkpoint is implemented, change the health response, run the test, observe the failure, then restore the expected response.
