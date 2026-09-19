# Docker and local Supabase

Docker runs disposable local services. LedgerCraft will use it for local Supabase, which includes PostgreSQL, Auth, Storage, and supporting services needed to test migrations and RLS.

## Current checkpoint

The package scripts **exist already**.

**Will be implemented soon after Supabase foundation:** `supabase/config.toml`, migrations, and database tests. The commands are therefore not a usable database workflow today.

## Will be implemented soon after Supabase foundation

After configuration and migrations are added, the local workflow will be:

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run supabase:stop
```

`db:reset` applies the migrations to a newly created local database. It deletes local database data. It is useful for proving that a clean checkout can reproduce the schema; it is not a production command.

## Why Docker is useful here

The Node API can run directly with npm. The database rules need a real PostgreSQL and Supabase environment. Docker gives every developer the same local services instead of requiring manual installation and configuration of each dependency.

## What Docker does not do

Docker does not deploy the API, provide hosted email delivery, configure a production Supabase project, or replace security review. It makes local integration testing repeatable.
