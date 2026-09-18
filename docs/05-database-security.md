# Database security

PostgreSQL is responsible for more than storing data. It will enforce data structure, relationships, and row-level access rules even when a valid Supabase token reaches the database directly.

## Will be implemented soon after Supabase foundation

The `supabase/` directory does not exist yet. It will contain:

```text
supabase/
├── config.toml
├── migrations/
│   ├── identity and workspace tables
│   └── organisation membership functions
└── tests/database/
    └── pgTAP tests for allowed and denied access
```

The first migration will create:

| Object | Responsibility |
| --- | --- |
| `profiles` | Application-owned data for an authenticated person. |
| `workspaces` | Personal or organisation tenant data. |
| `workspace_members` | Which profiles belong to a workspace and their role. |
| Sign-up trigger | Creates a profile and personal workspace after Supabase creates a user. |
| RLS policies | Restrict rows visible or writable by the caller. |

## Two protection layers

```text
Route validation checks request shape
→ Supabase verifies identity
→ PostgreSQL RLS checks row access
→ SQL function checks multi-step business rule
```

Neither layer replaces the other. HTTP validation creates useful API errors. RLS prevents broad database access. A narrowly scoped SQL function keeps a role check and related write in one transaction.

## Terms

`SECURITY DEFINER` is a PostgreSQL function setting that lets a carefully written function use its owner’s database permissions. It must check `auth.uid()` explicitly and set an empty `search_path`; it is not a shortcut for bypassing authorization.

## Test rule

Every database authorization rule will have an allowed test and a denied test. For example: an Admin can add a member, while a Member cannot add a member to the same workspace.
