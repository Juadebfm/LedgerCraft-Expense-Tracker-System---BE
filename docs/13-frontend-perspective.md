# Frontend perspective

LedgerCraft will serve a React frontend, likely using the browser `fetch` API. No React source exists in this repository.

## Exists already

`.env.example` **exists already** and names `CORS_ORIGIN`, which will identify the frontend origin allowed to call the API from a browser. CORS is not configured in a running Fastify application yet.

## Will be implemented soon after Application foundation

A React client will eventually call the health endpoint with:

```ts
const response = await fetch(`${apiUrl}/health`);
const body = await response.json();
```

## Will be implemented soon after Authentication

Protected calls will send a bearer token:

```ts
const response = await fetch(`${apiUrl}/v1/me`, {
  headers: { authorization: `Bearer ${accessToken}` },
});
```

The frontend is responsible for fields, loading states, and safe messages. The backend is responsible for input validation, identity verification, authorization, and data changes. Hiding an Admin button does not make an unauthorized request safe.

## Response handling

| Status | Intended frontend response |
| --- | --- |
| `200` | Read returned data. |
| `201` | Use the created resource. |
| `204` | Update local state; do not call `response.json()`. |
| `400` | Show safe validation feedback. |
| `401` | Show a signed-out state or begin the chosen sign-in flow. |
| `403` | Show unavailable/forbidden state. |
| `429` | Tell the person to wait; do not retry in a tight loop. |
| `500` | Show a general retry-later message. |
