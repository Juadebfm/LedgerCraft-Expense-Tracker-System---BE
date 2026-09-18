# Product roadmap

The product design is detailed in [MVP architecture guide](mvp-archi.md). This roadmap turns that destination into implementation stages without claiming the stages already exist.

| Stage | Status | Outcome |
| --- | --- | --- |
| Application foundation | **Will be implemented soon after the current checkpoint.** | Running Fastify application, reachable health route, and passing route test. |
| Validation and errors | **Will be implemented soon after Application foundation.** | Predictable input validation and JSON errors. |
| Identity and tenancy | **Will be implemented soon after Validation and errors.** | Supabase config, profiles, personal workspaces, memberships, migrations, and RLS. |
| Authentication | **Will be implemented soon after Identity and tenancy.** | Sign-up, sign-in, recovery, sign-out, password update, and current-user data. |
| Organisation management | **Will be implemented soon after Authentication.** | Organisation workspaces, roles, membership operations, and database tests. |
| User lifecycle | **Will be implemented soon after Organisation management.** | Invitations, account lifecycle, avatar policy, and hosted email configuration. |
| Expenses and receipts | **Will be implemented soon after User lifecycle.** | Expense state transitions, private receipt Storage, and authorization. |
| Budgets, dashboards, and FX | **Will be implemented soon after Expenses and receipts.** | Reporting rules, currency snapshots, budgets, and dashboard queries. |
| Audit, hardening, and operations | **Will be implemented soon after core product rules.** | Audit events, rate limits, observability, CI, and deployment verification. |

Each stage must leave the repository with code, tests, and documentation that accurately describe the new checkpoint.
