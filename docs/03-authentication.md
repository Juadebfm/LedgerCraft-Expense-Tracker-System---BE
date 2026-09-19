# Authentication and current-user data

Authentication answers “who is this caller?” Authorization answers “may this caller do this action?” LedgerCraft will use Supabase Auth for credentials and sessions, while application tables own profiles and workspace memberships.

## Exists already

| File | Status | Meaning |
| --- | --- | --- |
| `src/modules/bearer-token.ts` | **Exists already** | Parses the header format `Authorization: Bearer <token>`. It does not prove the token is valid. |
| `src/modules/types.ts` | **Exists already** | Declares intended `AuthGateway`, session, profile, workspace, and membership contracts. |
| `.env.example` | **Exists already** | Names Supabase configuration values; placeholders are not usable credentials. |

## Will be implemented soon after Authentication

The following flow will be added:

```text
POST /v1/auth/sign-up
→ validate email, password, name, and currency
→ Supabase Auth creates auth.users
→ database trigger creates profile and personal workspace
→ API returns user and any available session
```

The same module will later provide sign-in, password recovery, sign-out, password update, and `GET /v1/me`.

**Will be implemented soon after Authentication:** `src/modules/supabase-gateway.ts` will keep Supabase-specific calls out of route files. Routes will receive HTTP input; the gateway will translate a LedgerCraft operation into Supabase Auth or database calls.

## Secrets and tokens

The Supabase publishable key identifies the project and may be used by a client only with correctly configured RLS. A Supabase secret/service key bypasses RLS and must stay on trusted backend infrastructure. It must never be sent to React, committed to Git, or added to documentation examples as a real value.

## Frontend perspective

After sign-in, a client will use the returned access token in protected calls:

```ts
fetch(`${apiUrl}/v1/me`, {
  headers: { authorization: `Bearer ${accessToken}` },
});
```

Where a React application stores and refreshes tokens is a separate security decision. The backend must work correctly regardless of whether the client hides a control.
