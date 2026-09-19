# Workspaces and roles

A workspace is the boundary for ownership and authorization. A person will receive one personal workspace at sign-up. An organisation workspace can contain several people.

## Will be implemented soon after Workspaces and roles

The database will define two workspace types and two roles:

| Item | Meaning |
| --- | --- |
| Personal workspace | A workspace created for one person at sign-up. |
| Organisation workspace | A shared workspace created separately. |
| `admin` | Can manage organisation membership and later approve organisation expenses. |
| `member` | Can belong to an organisation but cannot manage membership. |

The intended membership operations are:

```text
POST /v1/workspaces
GET /v1/workspaces/:workspaceId/members
POST /v1/workspaces/:workspaceId/members
PUT /v1/workspaces/:workspaceId/members/:profileId
DELETE /v1/workspaces/:workspaceId/members/:profileId
```

These paths are not implemented yet. The database, not React, will enforce whether a caller is an Admin.

## Why this belongs in SQL

Membership changes need a permission check and a write to happen together. A future PostgreSQL function will check the caller’s role, reject personal-workspace membership changes, preserve at least one Admin, and write the membership in one transaction.

## Frontend perspective

The UI can hide member-management controls for Members, but that is only an experience improvement. The API and database must still return `403` for a direct unauthorized request.
