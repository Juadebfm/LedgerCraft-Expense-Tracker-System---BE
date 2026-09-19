# Security baseline

This document separates protections that exist from protections planned for later checkpoints. It does not claim that the repository is production-ready.

## Exists already

| Control | Current behaviour |
| --- | --- |
| Environment parsing | `src/config/env.ts` uses Zod to reject configuration that does not match its current schema. |
| Secret exclusion | `.gitignore` excludes `.env` files while retaining `.env.example`. |
| Bearer-header parsing | `getBearerToken()` rejects missing or malformed bearer headers. |
| Error vocabulary | `AppError` carries a status code and stable error code. |

These controls do not yet form a complete request-security system because no Fastify application, routes, Supabase client, database schema, or error handler is connected.

## Will be implemented soon after Security baseline

| Control | Purpose |
| --- | --- |
| CORS configuration | Limits browser origins permitted to call the API. |
| Security headers | Reduces common browser attack surfaces. |
| Rate limiting | Limits repeated requests, especially sign-in, recovery, and sign-up. |
| Shared Redis counter | Keeps limits correct across multiple API instances. |
| Dependency audit in CI | Detects known high-severity dependency vulnerabilities. |
| Upload rules | Defines allowed file type, size, Storage bucket visibility, and owner access. |

## Responsibility boundaries

Infrastructure such as a hosting provider or edge network can filter network-level denial-of-service traffic before it reaches Node.js. The API still needs application-level controls for valid-looking repeated requests. Supabase Auth handles credential verification; LedgerCraft must still enforce product authorization and database access rules.

## Rules that never change

- Never commit real keys, tokens, passwords, or customer data.
- Never send a Supabase secret/service key to a browser.
- Never treat client-supplied role, user ID, approval status, or workspace ID as authorization proof.
- Add an allowed and denied test when adding an authorization rule.
