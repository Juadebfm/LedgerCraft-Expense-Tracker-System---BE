import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";

import type {
  AvatarUpload,
  AuthGateway,
  AuthenticatedUser,
  AuthSession,
  CurrencyCode,
  CurrentUser,
  Profile,
  WorkspaceRole,
} from "./types.js";

// Reads the publishable Supabase configuration or reports a safe service error.
function requireSupabaseConfig(): { url: string; publishableKey: string } {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    throw new AppError(
      503,
      "AUTH_CONFIGURATION_MISSING",
      "Supabase authentication is not configured",
    );
  }

  return {
    url: env.SUPABASE_URL,
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
  };
}

// Reads the server-only Supabase configuration needed for privileged actions.
function requireSupabaseAdminConfig(): { url: string; secretKey: string } {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new AppError(
      503,
      "AUTH_ADMIN_CONFIGURATION_MISSING",
      "The server-only Supabase admin key is not configured",
    );
  }
  return {
    url: env.SUPABASE_URL,
    secretKey: env.SUPABASE_SECRET_KEY,
  };
}

// Creates a stateless client for public Supabase Auth operations.
function createPublicClient(): SupabaseClient {
  const { url, publishableKey } = requireSupabaseConfig();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// Creates a caller-scoped client so database RLS evaluates the request token.
function createUserClient(accessToken: string): SupabaseClient {
  const { url, publishableKey } = requireSupabaseConfig();

  return createClient(url, publishableKey, {
    accessToken: async () => accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// Creates a server-only client for actions that require Supabase admin access.
function createAdminClient(): SupabaseClient {
  const { url, secretKey } = requireSupabaseAdminConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// Calls a Supabase Auth endpoint with the clients's bearer token and maps failures.
async function callAuthenticatedAuthEndpoint(
  accessToken: string,
  path: string,
  options: {
    method: "POST" | "PUT";
    body?: Record<string, string>;
  } = { method: "POST" },
): Promise<void> {
  const { url, publishableKey } = requireSupabaseConfig();
  const endpoint = new URL(path, `${url.replace(/\/$/, "")}/`).toString();
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: options.method,
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${accessToken}`,
        ...(options.body ? { "content-type": "application/json" } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new AppError(
      502,
      "AUTH_PROVIDER_UNAVAILABLE",
      "Supabase authentication is unavailable",
    );
  }

  if (response.ok) return;

  const payload: unknown = await response.json().catch(() => null);
  const message = payload && typeof payload === "object"
    && "msg" in payload && typeof payload.msg === "string"
    ? payload.msg
    : "Supabase authentication request failed.";
  const code = payload && typeof payload === "object"
    && "code" in payload && typeof payload.code === "string"
    ? payload.code
    : "SUPABASE_AUTH_ERROR";

  throw new AppError(response.status, code, message);
}

// Maps a Supabase Auth user to the API's user shape.
function toAuthenticatedUser(user: {
  id: string;
  email?: string | null;
}): AuthenticatedUser {
  return { id: user.id, email: user.email ?? null };
}

// Maps Supabase's snake_case session fields to the API session contract.
function toSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type: string;
}): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
    tokenType: session.token_type,
  };
}

type SupabaseWorkspace = {
  id: string;
  name: string;
  slug: string;
  type: "personal" | "organisation";
  reporting_currency: CurrencyCode;
};

type SupabaseWorkspaceMembership = {
  role: WorkspaceRole;
  workspace: SupabaseWorkspace | null;
};

type SupabaseWorkspaceMember = {
  profile_id: string;
  full_name: string;
  avatar_path: string | null;
  role: WorkspaceRole;
  joined_at: string;
};

type SupabaseProfile = {
  full_name: string;
  avatar_path: string | null;
  timezone: string | null;
};

// Converts a stored avatar path to its public Storage URL.
function toAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;

  return createPublicClient()
    .storage.from("avatars")
    .getPublicUrl(avatarPath).data.publicUrl;
}

// Maps a profile row from database naming to the API profile shape.
function toProfile(profile: SupabaseProfile): Profile {
  return {
    fullName: profile.full_name,
    avatarUrl: toAvatarUrl(profile.avatar_path),
    timezone: profile.timezone,
  };
}

// Maps a workspace membership query result to a current-user workspace.
function toCurrentUserWorkspace(
  membership: SupabaseWorkspaceMembership,
): CurrentUser["workspaces"][number] | null {
  if (!membership.workspace) return null;

  return {
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    type: membership.workspace.type,
    reportingCurrency: membership.workspace.reporting_currency,
    role: membership.role,
  };
}

const httpStatusByPostgresErrorCode: Record<string, number> = {
  "42501": 403,
  "23505": 409,
  "23514": 409,
  P0002: 404,
};

// Translates Supabase and PostgreSQL errors into application HTTP errors.
function throwSupabaseError(error: {
  message: string;
  status?: number | undefined;
  code?: string | undefined;
}): never {
  throw new AppError(
    error.status
      ?? (error.code ? httpStatusByPostgresErrorCode[error.code] : undefined)
      ?? 400,
    error.code ?? "SUPABASE_AUTH_ERROR",
    error.message,
  );
}

// Builds the complete AuthGateway backed by Supabase Auth, Postgres, and Storage.
export function createSupabaseAuthGateway(): AuthGateway {
  // Verifies a bearer token and returns its normalized authenticated user.
  async function authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const client = createPublicClient();
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new AppError(
        401,
        "UNAUTHENTICATED",
        "A valid bearer token is required.",
      );
    }

    return toAuthenticatedUser(data.user);
  }

  // Confirms the caller is an Admin of an organisation workspace before inviting.
  async function requireWorkspaceAdmin(
    accessToken: string,
    workspaceId: string,
  ): Promise<void> {
    const client = createUserClient(accessToken);
    const { data, error } = await client.rpc("is_workspace_admin", {
      target_workspace_id: workspaceId,
    });

    if (error) throwSupabaseError(error);
    if (data !== true) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Only a workspace Admin can invite members.",
      );
    }

    const { data: workspace, error: workspaceError } = await client
      .from("workspaces")
      .select("type")
      .eq("id", workspaceId)
      .single<{ type: "personal" | "organisation" }>();

    if (workspaceError) throwSupabaseError(workspaceError);
    if (workspace.type !== "organisation") {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Members can only be invited to organisation workspaces.",
      );
    }
  }

  return {
    // Registers a user and passes profile/workspace metadata to the sign-up trigger.
    async signUp(input) {
      const client = createPublicClient();
      const options = {
        data: {
          full_name: input.fullName,
          reporting_currency: input.reportingCurrency,
        },
        ...(env.EMAIL_CONFIRMATION_REDIRECT_URL
          ? { emailRedirectTo: env.EMAIL_CONFIRMATION_REDIRECT_URL }
          : {}),
      };
      const { data, error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options,
      });

      if (error) throwSupabaseError(error);

      return {
        user: data.user ? toAuthenticatedUser(data.user) : null,
        session: data.session ? toSession(data.session) : null,
      };
    },

    // Signs a user in and returns the normalized session tokens.
    async signIn(input) {
      const client = createPublicClient();
      const { data, error } = await client.auth.signInWithPassword(input);

      if (error) throwSupabaseError(error);
      if (!data.session) {
        throw new AppError(
          401,
          "AUTHENTICATION_FAILED",
          "The sign-in attempt did not create a session.",
        );
      }

      return toSession(data.session);
    },

    // Starts Supabase's password-recovery email flow.
    async requestPasswordRecovery(email) {
      const client = createPublicClient();
      const options = env.PASSWORD_RECOVERY_REDIRECT_URL
        ? { redirectTo: env.PASSWORD_RECOVERY_REDIRECT_URL }
        : undefined;
      const { error } = await client.auth.resetPasswordForEmail(email, options);

      if (error) throwSupabaseError(error);
    },

    // Revokes the supplied session without storing it in this stateless API.
    async signOut(accessToken) {
      await callAuthenticatedAuthEndpoint(
        accessToken,
        "auth/v1/logout?scope=local",
      );
    },

    // Changes the authenticated user's password through the Auth API.
    async updatePassword(accessToken, password) {
      await callAuthenticatedAuthEndpoint(accessToken, "auth/v1/user", {
        method: "PUT",
        body: { password },
      });
    },

    // Returns the caller's Auth identity, profile, and accessible workspaces.
    async getCurrentUser(accessToken) {
      const user = await authenticate(accessToken);
      const client = createUserClient(accessToken);
      const [profileResult, membershipsResult] = await Promise.all([
        client
          .from("profiles")
          .select("full_name, avatar_path, timezone")
          .single<SupabaseProfile>(),
        client
          .from("workspace_members")
          .select("role, workspace:workspaces(id, name, slug, type, reporting_currency)")
          .returns<SupabaseWorkspaceMembership[]>(),
      ]);

      if (profileResult.error) throwSupabaseError(profileResult.error);
      if (membershipsResult.error) throwSupabaseError(membershipsResult.error);

      return {
        user,
        profile: toProfile(profileResult.data),
        workspaces: membershipsResult.data.flatMap((membership) => {
          const workspace = toCurrentUserWorkspace(membership);
          return workspace ? [workspace] : [];
        }),
      } satisfies CurrentUser;
    },

    // Updates the authenticated user's editable profile fields.
    async updateProfile(accessToken, input) {
      const user = await authenticate(accessToken);
      const client = createUserClient(accessToken);
      const update: { full_name?: string; timezone?: string | null } = {};

      if (input.fullName !== undefined) update.full_name = input.fullName;
      if (input.timezone !== undefined) update.timezone = input.timezone;

      const { data, error } = await client
        .from("profiles")
        .update(update)
        .eq("id", user.id)
        .select("full_name, avatar_path, timezone")
        .single<SupabaseProfile>();

      if (error) throwSupabaseError(error);

      return toProfile(data);
    },

    // Replaces the caller's avatar object and saves its path on the profile.
    async uploadAvatar(accessToken, avatar) {
      const user = await authenticate(accessToken);
      const client = createUserClient(accessToken);
      const avatarPath = `${user.id}/avatar`;
      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(avatarPath, avatar.content, {
          contentType: avatar.contentType,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throwSupabaseError(uploadError);

      const { data, error } = await client
        .from("profiles")
        .update({ avatar_path: avatarPath })
        .eq("id", user.id)
        .select("full_name, avatar_path, timezone")
        .single<SupabaseProfile>();

      if (error) throwSupabaseError(error);

      return toProfile(data);
    },

    // Soft-deletes the profile, then deletes Auth access with rollback on failure.
    async softDeleteCurrentUser(accessToken) {
      const user = await authenticate(accessToken);
      const client = createUserClient(accessToken);
      const adminClient = createAdminClient();

      const { error: profileError } = await client.rpc(
        "soft_delete_current_profile",
      );
      if (profileError) throwSupabaseError(profileError);

      const { error: authError } = await adminClient.auth.admin.deleteUser(
        user.id,
        true,
      );

      if (!authError) return;

      const { error: restoreError } = await adminClient
        .from("profiles")
        .update({ deleted_at: null })
        .eq("id", user.id);

      if (restoreError) throwSupabaseError(restoreError);
      throwSupabaseError(authError);
    },

    // Creates an organisation workspace and makes the caller its Admin.
    async createOrganisationWorkspace(accessToken, input) {
      const client = createUserClient(accessToken);
      const { data, error } = await client
        .rpc("create_organisation_workspace", {
          input_name: input.name,
          input_slug: input.slug,
          input_reporting_currency: input.reportingCurrency,
        })
        .single();

      if (error) throwSupabaseError(error);

      const workspace = data as SupabaseWorkspace & {
        role: "admin" | "member";
      };

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
        reportingCurrency: workspace.reporting_currency,
        role: workspace.role,
      };
    },

    // Lists workspace members through the Admin-protected database function.
    async listWorkspaceMembers(accessToken, workspaceId) {
      const client = createUserClient(accessToken);
      const { data, error } = await client.rpc("list_workspace_members", {
        target_workspace_id: workspaceId,
      });

      if (error) throwSupabaseError(error);

      const members = data as SupabaseWorkspaceMember[];

      return members.map((member) => ({
        profileId: member.profile_id,
        fullName: member.full_name,
        avatarUrl: toAvatarUrl(member.avatar_path),
        role: member.role,
        joinedAt: member.joined_at,
      }));
    },

    // Adds an existing profile to an organisation workspace through its RPC.
    async addWorkspaceMember(accessToken, input) {
      const client = createUserClient(accessToken);
      const { error } = await client.rpc("add_workspace_member", {
        target_workspace_id: input.workspaceId,
        target_profile_id: input.profileId,
        target_role: input.role,
      });

      if (error) throwSupabaseError(error);
    },

    // Invites an email address, then gives the invited user workspace membership.
    async inviteWorkspaceMember(accessToken, input) {
      await authenticate(accessToken);
      await requireWorkspaceAdmin(accessToken, input.workspaceId);
      const adminClient = createAdminClient();
      const options = env.INVITATION_REDIRECT_URL
        ? { redirectTo: env.INVITATION_REDIRECT_URL }
        : undefined;
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
        input.email,
        options,
      );

      if (error) throwSupabaseError(error);
      if (!data.user) {
        throw new AppError(
          502,
          "INVITATION_FAILED",
          "Supabase did not create an invited user.",
        );
      }

      const { error: membershipError } = await adminClient
        .from("workspace_members")
        .insert({
          workspace_id: input.workspaceId,
          profile_id: data.user.id,
          role: input.role,
        });

      if (membershipError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        throwSupabaseError(membershipError);
      }

      return toAuthenticatedUser(data.user);
    },

    // Changes a member role while the database preserves the Admin invariant.
    async setWorkspaceMemberRole(accessToken, input) {
      const client = createUserClient(accessToken);
      const { error } = await client.rpc("set_workspace_member_role", {
        target_workspace_id: input.workspaceId,
        target_profile_id: input.profileId,
        target_role: input.role,
      });

      if (error) throwSupabaseError(error);
    },

    // Removes a member while the database protects the final Admin role.
    async removeWorkspaceMember(accessToken, input) {
      const client = createUserClient(accessToken);
      const { error } = await client.rpc("remove_workspace_member", {
        target_workspace_id: input.workspaceId,
        target_profile_id: input.profileId,
      });

      if (error) throwSupabaseError(error);
    },
  };
}
