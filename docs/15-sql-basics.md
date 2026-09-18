# SQL basics for LedgerCraft

SQL is the language PostgreSQL uses to describe and query data. LedgerCraft will keep schema-changing SQL in ordered migration files instead of scattering schema changes through route code.

## Will be implemented soon after Supabase foundation

The first migration will create application tables similar to:

```sql
create table public.profiles (
  id uuid primary key references auth.users (id),
  full_name text not null,
  timezone text
);
```

The exact migration does not exist yet. This example introduces the vocabulary that will be used when it is added.

## Tables, rows, and columns

A table holds one kind of record. A row is one record. A column is one value on that record.

| Word | Example |
| --- | --- |
| Table | `profiles` |
| Row | One person’s profile |
| Column | `profiles.full_name` |
| Primary key | The unique `profiles.id` value |
| Foreign key | A value that must point to an existing related row |

## Core commands

| Command | Meaning | Future LedgerCraft use |
| --- | --- | --- |
| `INSERT` | Create a row. | Create a profile/workspace from a sign-up trigger. |
| `SELECT` | Read rows. | Read current-user profile and workspaces. |
| `UPDATE` | Change matching rows. | Update profile settings or a member role. |
| `DELETE` | Remove matching rows. | Remove a workspace membership when permitted. |

`WHERE` is critical because it limits the rows an operation affects:

```sql
update public.profiles
set full_name = 'Amara Eze'
where id = 'a-user-id';
```

Without `WHERE`, that statement would target every profile row.

## Relationships

`workspace_members` will connect profiles and workspaces. A `JOIN` combines related rows:

```sql
select workspaces.name, workspace_members.role
from public.workspace_members
join public.workspaces
  on workspaces.id = workspace_members.workspace_id
where workspace_members.profile_id = 'a-profile-id';
```

## Constraints, functions, and RLS

Constraints make invalid data impossible at the database layer: `not null`, `unique`, `check`, primary keys, and foreign keys.

Functions will group multi-step membership rules. RLS policies will limit which rows a caller can read or change. Read [Database security](05-database-security.md) before changing a migration or policy.

## Testing SQL

Database tests will be implemented soon after the first migration. They will use pgTAP to prove both allowed and denied database access. A route test cannot replace a database-policy test because the policy runs inside PostgreSQL.
