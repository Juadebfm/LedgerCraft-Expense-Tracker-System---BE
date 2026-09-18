# Current API map

No HTTP endpoint is reachable today because `src/app.ts` and `src/server.ts` are empty.

| Method and path | Status | Notes |
| --- | --- | --- |
| `GET /health` | **Will be implemented soon after Application foundation.** | A handler definition exists in `src/routes/health.ts`, but it is not exported or registered. |
| `POST /v1/auth/sign-up` | **Will be implemented soon after Authentication.** | No route or Supabase gateway exists yet. |
| `POST /v1/auth/sign-in` | **Will be implemented soon after Authentication.** | No route or Supabase gateway exists yet. |
| `POST /v1/auth/password-recovery` | **Will be implemented soon after Authentication.** | No route or Supabase gateway exists yet. |
| `GET /v1/me` | **Will be implemented soon after Authentication.** | Requires a verified caller and database schema. |
| Workspace membership routes | **Will be implemented soon after Workspaces and roles.** | Require SQL migrations, RLS, and membership functions. |
| Expense, budget, receipt, dashboard, and audit routes | **Will be implemented soon after their named product roadmap stages.** | Their design is described in [Product roadmap](14-product-roadmap.md). |

An API map is a contract, not a wish list. This page lists future paths only because each one is explicitly marked as not implemented.
