import type { FastifyPluginAsync } from "fastify";

import { z } from "zod";

import { securityPolicy } from "../config/security.js";
import { getBearerToken } from "../modules/auth/bearer-token.js";
import type { AuthGateway } from "../modules/auth/types.js";
import { request } from "http";

// Write schema for email as a blueprijnt for how info is stored on the db

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((email) => email.toLowerCase());

const passwordSchema = z.string().min(8).max(128);

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(1).max(120),
  reportingCurrency: z.enum(["NGN", "USD"]).default("NGN"),
});

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const passwordRecoverySchema = z.object({
  email: emailSchema,
});

const passwordUpdateSchema = z.object({
  password: passwordSchema,
});

function serializeSession(session: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  tokenType: string;
}) {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    tokenType: session.tokenType,
  };
}

export function createAuthRoutes(authGateway: AuthGateway): FastifyPluginAsync {
  return async (app) => {
    // Signup Route
    app.post(
      "/v1/auth/sign-up",
      {
        config: {
          rateLimit: securityPolicy.signUp,
        },
      },
      async (request, reply) => {
        const input = signUpSchema.parse(request.body);
        const result = await authGateway.signUp(input);

        return reply.code(201).send({
          user: result.user,
          session: result.session ? serializeSession(result.session) : null,
          requireEmailConfirmation: result.session === null,
        });
      },
    );
    // Signin Route
    app.post(
      "/v1/auth/sign-in",
      {
        config: {
          rateLimit: securityPolicy.signUp,
        },
      },
      async (request, reply) => {
        const input = signInSchema.parse(request.body);
        const session = await authGateway.signIn(input);

        return { session: serializeSession(session) };
      },
    );
    // Signout
    app.post("/v1/auth/sign-out", async (request, reply) => {
      const accessToken = getBearerToken(request.headers.authorization);
      authGateway.signOut(accessToken);
      return reply.code(204).send();
    });
    // Password Recovery / Forgot password
    app.post(
      "/v1/auth/password-recovery",
      {
        config: {
          rateLimit: securityPolicy.signUp,
        },
      },
      async (request, reply) => {
        const input = passwordRecoverySchema.parse(request.body);
        await authGateway.requestPasswordRecovery(input.email);

        // Do not disclose whether an email is registered or not for sec reasons
        return reply.code(202).send({
          message:
            "If an account exists for that email address, rocovery instructions have been sent",
        });
      },
    );
    // Update password / Change password / reset
    app.post("/v1/auth/password", async (request, reply) => {
      const accessToken = getBearerToken(request.headers.authorization);
      const input = passwordUpdateSchema.parse(request.body);
      await authGateway.updatePassword(accessToken, input.password);
      return reply.code(204).send();
    });
  };
}
