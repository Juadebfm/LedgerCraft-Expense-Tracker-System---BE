import type { FastifyPluginAsync } from "fastify";

import { z } from "zod";

import { securityPolicy } from "../config/security.js";
import { getBearerToken } from "../modules/auth/bearer-token.js";
import type { AuthGateway, WorkspaceRole } from "../modules/auth/types.js";

const workspaceRoleSchema = z.enum([
  "admin",
  "member",
]) satisfies z.ZodType<WorkspaceRole>;

const workspaceIdParamsSchema = z.object({
  workspaceId: z.string().uuid(),
});

const memberParamsSchema = z.object({
  workspaceId: z.string().uuid(),
  profileId: z.string().uuid(),
});

const createOrganisationWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slug must be lowercase, alphanumeric, and hyphen-separated",
    ),
  reportingCurrency: z.enum(["NGN", "USD"]).default("NGN"),
});

const addWorkspaceMemberSchema = z.object({
  profileId: z.string().uuid(),
  role: workspaceRoleSchema,
});

const inviteWorkspaceMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((email) => email.toLowerCase()),
  role: workspaceRoleSchema,
});

const updateWorkspaceMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
});

export function createWorkspaceRoutes(
  authGateway: AuthGateway,
): FastifyPluginAsync {
  return async (app) => {
    // Create an organisation workspace; the caller becomes its Admin.
    app.post(
      "/v1/workspaces",
      {
        config: {
          rateLimit: securityPolicy.signUp,
        },
      },
      async (request, reply) => {
        const accessToken = getBearerToken(request.headers.authorization);
        const input = createOrganisationWorkspaceSchema.parse(request.body);
        const workspace = await authGateway.createOrganisationWorkspace(
          accessToken,
          input,
        );

        return reply.code(201).send({ workspace });
      },
    );

    // List members of an organisation workspace.
    app.get(
      "/v1/workspaces/:workspaceId/members",
      {
        config: {
          rateLimit: securityPolicy.api,
        },
      },
      async (request, reply) => {
        const accessToken = getBearerToken(request.headers.authorization);
        const { workspaceId } = workspaceIdParamsSchema.parse(request.params);
        const members = await authGateway.listWorkspaceMembers(
          accessToken,
          workspaceId,
        );

        return { members };
      },
    );

    // Add a profile that already exists to a workspace directly.
    app.post(
      "/v1/workspaces/:workspaceId/members",
      {
        config: {
          rateLimit: securityPolicy.api,
        },
      },
      async (request, reply) => {
        const accessToken = getBearerToken(request.headers.authorization);
        const { workspaceId } = workspaceIdParamsSchema.parse(request.params);
        const input = addWorkspaceMemberSchema.parse(request.body);

        await authGateway.addWorkspaceMember(accessToken, {
          workspaceId,
          profileId: input.profileId,
          role: input.role,
        });

        return reply.code(204).send();
      },
    );

    // Invite a new user by email and add them to the workspace once created.
    app.post(
      "/v1/workspaces/:workspaceId/invitations",
      {
        config: {
          rateLimit: securityPolicy.signUp,
        },
      },
      async (request, reply) => {
        const accessToken = getBearerToken(request.headers.authorization);
        const { workspaceId } = workspaceIdParamsSchema.parse(request.params);
        const input = inviteWorkspaceMemberSchema.parse(request.body);

        const invitedUser = await authGateway.inviteWorkspaceMember(
          accessToken,
          {
            workspaceId,
            email: input.email,
            role: input.role,
          },
        );

        return reply.code(201).send({ invitedUser });
      },
    );

    // Change an existing member's role within the workspace.
    app.patch(
      "/v1/workspaces/:workspaceId/members/:profileId",
      {
        config: {
          rateLimit: securityPolicy.api,
        },
      },
      async (request, reply) => {
        const accessToken = getBearerToken(request.headers.authorization);
        const { workspaceId, profileId } = memberParamsSchema.parse(
          request.params,
        );
        const input = updateWorkspaceMemberRoleSchema.parse(request.body);

        await authGateway.setWorkspaceMemberRole(accessToken, {
          workspaceId,
          profileId,
          role: input.role,
        });

        return reply.code(204).send();
      },
    );

    // Remove a member from the workspace.
    app.delete(
      "/v1/workspaces/:workspaceId/members/:profileId",
      {
        config: {
          rateLimit: securityPolicy.api,
        },
      },
      async (request, reply) => {
        const accessToken = getBearerToken(request.headers.authorization);
        const { workspaceId, profileId } = memberParamsSchema.parse(
          request.params,
        );

        await authGateway.removeWorkspaceMember(accessToken, {
          workspaceId,
          profileId,
        });

        return reply.code(204).send();
      },
    );
  };
}
