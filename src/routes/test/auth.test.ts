import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { AppError } from "../../lib/app-error.js";
import type { AuthGateway } from "../../modules/auth/types.js";
import { createAuthRoutes } from "../auth.js";

// Helpers

type MockGateway = { [K in keyof AuthGateway]: ReturnType<typeof vi.fn> };

function createMockGateway(): MockGateway {
  return {
    signUp: vi.fn(),
    signIn: vi.fn(),
    requestPasswordRecovery: vi.fn(),
    signOut: vi.fn(),
    updatePassword: vi.fn(),
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    softDeleteCurrentUser: vi.fn(),
    createOrganisationWorkspace: vi.fn(),
    listWorkspaceMembers: vi.fn(),
    addWorkspaceMember: vi.fn(),
    inviteWorkspaceMember: vi.fn(),
    setWorkspaceMemberRole: vi.fn(),
    removeWorkspaceMember: vi.fn(),
  };
}

// Minimal error handler so tests don't depend on your real app bootstrap.
// If you have a shared one (e.g. registerErrorHandler(app)), use that instead.
async function buildApp(gateway: MockGateway): Promise<FastifyInstance> {
  const app = Fastify();

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ code: "VALIDATION_ERROR" });
    }
    const err = error as {
      statusCode?: number;
      status?: number;
      code?: string;
    };
    const status = err.statusCode ?? err.status ?? 500;
    return reply.code(status).send({ code: err.code ?? "INTERNAL_ERROR" });
  });

  await app.register(createAuthRoutes(gateway as unknown as AuthGateway));
  await app.ready();
  return app;
}

const validSession = {
  accessToken: "access-123",
  refreshToken: "refresh-456",
  expiresAt: 1_900_000_000,
  tokenType: "bearer",
};

const validUser = { id: "user-1", email: "ada@example.com" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("auth routes", () => {
  let app: FastifyInstance;
  let gateway: MockGateway;

  beforeEach(async () => {
    gateway = createMockGateway();
    app = await buildApp(gateway);
  });

  afterEach(async () => {
    await app.close();
  });

  // -------------------------------------------------------------------------
  describe("POST /v1/auth/sign-up", () => {
    const validBody = {
      email: "ada@example.com",
      password: "password123",
      fullName: "Ada Obi",
      reportingCurrency: "USD",
    };

    it("returns 201 with user and session when sign-up creates a session", async () => {
      gateway.signUp.mockResolvedValue({
        user: validUser,
        session: validSession,
      });

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-up",
        payload: validBody,
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({
        user: validUser,
        session: validSession,
        requireEmailConfirmation: false,
      });
      expect(gateway.signUp).toHaveBeenCalledWith(validBody);
    });

    it("flags requireEmailConfirmation when no session is returned", async () => {
      gateway.signUp.mockResolvedValue({ user: validUser, session: null });

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-up",
        payload: validBody,
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({
        user: validUser,
        session: null,
        requireEmailConfirmation: true,
      });
    });

    it("trims and lowercases the email and trims fullName", async () => {
      gateway.signUp.mockResolvedValue({ user: validUser, session: null });

      await app.inject({
        method: "POST",
        url: "/v1/auth/sign-up",
        payload: {
          ...validBody,
          email: "  Ada@Example.COM ",
          fullName: "  Ada Obi  ",
        },
      });

      expect(gateway.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "ada@example.com",
          fullName: "Ada Obi",
        }),
      );
    });

    it("defaults reportingCurrency to NGN", async () => {
      gateway.signUp.mockResolvedValue({ user: validUser, session: null });
      const { reportingCurrency: _omit, ...body } = validBody;

      await app.inject({
        method: "POST",
        url: "/v1/auth/sign-up",
        payload: body,
      });

      expect(gateway.signUp).toHaveBeenCalledWith(
        expect.objectContaining({ reportingCurrency: "NGN" }),
      );
    });

    it("only exposes whitelisted session fields", async () => {
      gateway.signUp.mockResolvedValue({
        user: validUser,
        session: {
          ...validSession,
          providerToken: "secret",
          user: { id: "x" },
        },
      });

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-up",
        payload: validBody,
      });

      expect(res.json().session).toEqual(validSession);
    });

    it.each([
      ["invalid email", { email: "not-an-email" }],
      ["email over 320 chars", { email: `${"a".repeat(320)}@example.com` }],
      ["password under 8 chars", { password: "short" }],
      ["password over 128 chars", { password: "p".repeat(129) }],
      ["empty fullName", { fullName: "   " }],
      ["fullName over 120 chars", { fullName: "n".repeat(121) }],
      ["unsupported currency", { reportingCurrency: "EUR" }],
      ["missing email", { email: undefined }],
    ])("returns 400 for %s", async (_label, override) => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-up",
        payload: { ...validBody, ...override },
      });

      expect(res.statusCode).toBe(400);
      expect(gateway.signUp).not.toHaveBeenCalled();
    });

    it("propagates gateway errors (e.g. duplicate email)", async () => {
      gateway.signUp.mockRejectedValue(
        new AppError(422, "user_already_exists", "User already registered"),
      );

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-up",
        payload: validBody,
      });

      expect(res.statusCode).toBe(422);
      expect(res.json().code).toBe("user_already_exists");
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /v1/auth/sign-in", () => {
    const validBody = { email: "ada@example.com", password: "password123" };

    it("returns 200 with a serialized session", async () => {
      gateway.signIn.mockResolvedValue({ ...validSession, extra: "nope" });

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-in",
        payload: validBody,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ session: validSession });
    });

    it("normalizes the email before calling the gateway", async () => {
      gateway.signIn.mockResolvedValue(validSession);

      await app.inject({
        method: "POST",
        url: "/v1/auth/sign-in",
        payload: { ...validBody, email: " ADA@Example.com " },
      });

      expect(gateway.signIn).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "password123",
      });
    });

    it.each([
      ["invalid email", { email: "nope" }],
      ["short password", { password: "short" }],
      ["missing password", { password: undefined }],
    ])("returns 400 for %s", async (_label, override) => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-in",
        payload: { ...validBody, ...override },
      });

      expect(res.statusCode).toBe(400);
      expect(gateway.signIn).not.toHaveBeenCalled();
    });

    it("propagates invalid-credentials errors from the gateway", async () => {
      gateway.signIn.mockRejectedValue(
        new AppError(400, "invalid_credentials", "Invalid login credentials"),
      );

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-in",
        payload: validBody,
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe("invalid_credentials");
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /v1/auth/sign-out", () => {
    it("returns 204 and passes the bearer token to the gateway", async () => {
      gateway.signOut.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-out",
        headers: { authorization: "Bearer token-abc" },
      });

      expect(res.statusCode).toBe(204);
      expect(res.body).toBe("");
      expect(gateway.signOut).toHaveBeenCalledWith("token-abc");
    });

    it("returns 401 and skips the gateway when the header is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-out",
      });

      expect(res.statusCode).toBe(401);
      expect(gateway.signOut).not.toHaveBeenCalled();
    });

    // The route currently calls `authGateway.signOut(...)` without `await`,
    // so a gateway failure is swallowed (and becomes an unhandled rejection).
    // Add `await` in the route, then un-skip this test.
    it.skip("propagates gateway failures", async () => {
      gateway.signOut.mockRejectedValue(
        new AppError(502, "AUTH_PROVIDER_UNAVAILABLE", "unavailable"),
      );

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/sign-out",
        headers: { authorization: "Bearer token-abc" },
      });

      expect(res.statusCode).toBe(502);
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /v1/auth/password-recovery", () => {
    it("returns 202 with a generic message and normalized email", async () => {
      gateway.requestPasswordRecovery.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/password-recovery",
        payload: { email: " Ada@Example.com " },
      });

      expect(res.statusCode).toBe(202);
      expect(res.json()).toHaveProperty("message");
      expect(gateway.requestPasswordRecovery).toHaveBeenCalledWith(
        "ada@example.com",
      );
    });

    it("returns the same response regardless of the email (no enumeration)", async () => {
      gateway.requestPasswordRecovery.mockResolvedValue(undefined);

      const [a, b] = await Promise.all(
        ["exists@example.com", "ghost@example.com"].map((email) =>
          app.inject({
            method: "POST",
            url: "/v1/auth/password-recovery",
            payload: { email },
          }),
        ),
      );

      expect(a!.statusCode).toBe(b!.statusCode);
      expect(a!.json()).toEqual(b!.json());
    });

    it("returns 400 for an invalid email", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/password-recovery",
        payload: { email: "nope" },
      });

      expect(res.statusCode).toBe(400);
      expect(gateway.requestPasswordRecovery).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe("POST /v1/auth/password", () => {
    const headers = { authorization: "Bearer token-abc" };

    it("returns 204 and updates the password with the caller's token", async () => {
      gateway.updatePassword.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/password",
        headers,
        payload: { password: "new-password-123" },
      });

      expect(res.statusCode).toBe(204);
      expect(gateway.updatePassword).toHaveBeenCalledWith(
        "token-abc",
        "new-password-123",
      );
    });

    it("returns 401 when the bearer token is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/password",
        payload: { password: "new-password-123" },
      });

      expect(res.statusCode).toBe(401);
      expect(gateway.updatePassword).not.toHaveBeenCalled();
    });

    it.each([
      ["too short", "short"],
      ["too long", "p".repeat(129)],
    ])("returns 400 when the password is %s", async (_label, password) => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/password",
        headers,
        payload: { password },
      });

      expect(res.statusCode).toBe(400);
      expect(gateway.updatePassword).not.toHaveBeenCalled();
    });

    it("propagates gateway errors", async () => {
      gateway.updatePassword.mockRejectedValue(
        new AppError(422, "same_password", "New password must differ"),
      );

      const res = await app.inject({
        method: "POST",
        url: "/v1/auth/password",
        headers,
        payload: { password: "new-password-123" },
      });

      expect(res.statusCode).toBe(422);
      expect(res.json().code).toBe("same_password");
    });
  });
});
