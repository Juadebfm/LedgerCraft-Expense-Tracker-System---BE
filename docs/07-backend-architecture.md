# Backend architecture

LedgerCraft is intended to be a modular monolith.

```text
One deployable LedgerCraft API
├── routes: receive HTTP input and send HTTP responses
├── modules: translate product operations to Supabase or focused helpers
├── configuration: validate environment values and policies
└── SQL migrations: define data and database authorization rules
```

## Exists already

The repository already has a `src/` structure, configuration file, route folder, module folder, and shared error folder. It does not yet assemble them into a running monolith.

## Will be implemented soon after Application foundation

**Will be implemented soon after Application foundation:** `src/app.ts` will become the visible assembly point. It will create one Fastify instance and register each route group. This keeps the request path easy to follow and gives tests a real app to inject requests into.

## Architecture comparison

| Style | Meaning | LedgerCraft status |
| --- | --- | --- |
| Monolith | One deployed backend application. | The intended deployment shape. |
| Modular monolith | One deployment with focused internal modules. | The intended code organisation. |
| Microservices | Independently deployed services communicating over a network. | Not used. Current product size does not justify that operational complexity. |
| Serverless functions | Independently invoked functions managed by a platform. | Not selected. |

Scaling is an operational concern for later. Vertical scaling gives one instance more CPU or memory. Horizontal scaling runs several instances behind a load balancer. Any future rate limiter must use shared state when more than one API instance is running.
