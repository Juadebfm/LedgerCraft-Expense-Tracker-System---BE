# Validation and errors

Every request received from a browser is untrusted input. Validation checks whether the request has the shape an endpoint expects. Error handling converts expected failures into one predictable response shape.

## Exists already

`src/lib/app-error.ts` **exists already**. It represents an expected application failure using:

```ts
new AppError(401, 'UNAUTHENTICATED', 'A bearer token is required.')
```

The bearer-token helper already uses this type. No Fastify error handler exists yet, so these errors are not yet converted into LedgerCraft’s final JSON API format.

## Will be implemented soon after Validation and errors

**Will be implemented soon after Validation and errors:** `src/configure-error-handler.ts` will register one Fastify error handler. It will return a consistent response such as:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body is invalid."
  }
}
```

Zod will validate request bodies, path parameters, query strings, and environment values. A route will parse input first, then call the business or external-service layer only after parsing succeeds.

## Status codes

| Status | Meaning |
| --- | --- |
| `200` | Successful read or update with a response body. |
| `201` | A resource was created. |
| `202` | A request was accepted without revealing sensitive account information. |
| `204` | Successful action with no response body. |
| `400` | Invalid request input. |
| `401` | Missing or invalid authentication. |
| `403` | Authenticated caller lacks permission. |
| `409` | A conflicting change, such as duplicate membership. |
| `429` | A rate limit was exceeded. |
| `500` | Unexpected server failure. |

## Frontend perspective

React can validate fields early to give fast feedback, but the backend must validate again because clients can bypass browser code. A UI should display safe error messages and must not rely on a local role or hidden button as permission.
