# Things to do when starting this project or any other project

1. Initialize Node JS:

```bash
npm init -y
```

2. Install neccesary frameworks and deps:

```bash
npm i fastify @fastify/cors @supabase/supabase-js dotenv zod
```

3. Install dev dependencies:

```bash
npm i --save-dev typescript tsx vitest @types/node supabase
```

4. Create config files e.g tsconfig.json, .gitignore, .env.example.
5. Create src/ and src/config/env.ts
6. Create src/routes/health.ts.
7. Create src/app.ts, src/server.ts, and src/app.test.ts
8. Create all your need types and type files.
9. Create a general / global error handler file this handle all errors in your system. lib/app-error.ts
10. Now create the bearer token which helps us generate the access token at the app level or global level. create modules/auth/bearer-token.ts
11.
12. Run:

```bash
npm run typecheck
npm test
npm run build

```
