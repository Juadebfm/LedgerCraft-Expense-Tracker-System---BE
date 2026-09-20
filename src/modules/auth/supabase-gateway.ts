import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
import { access } from "fs";

// Validate conns

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

// Supabase Client Creation

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

async function callAuthenticatedAuthEndpoint(
  accessToken: string,
  path: string,
  options: {
    method: "POST" | "PUT";
    body?: Record<string, unknown>;
  },
): Promise<Response> {
  const { url, publishableKey } = requireSupabaseConfig();
  const endpoint = new URL(`/auth/v1/${path.replace(/^\/+/, "")}`, url);
  const headers: Record<string, string> = {
    apikey: publishableKey,
    authorization: `Bearer ${accessToken}`,
  };

  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: options.method,
      headers,
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new AppError(
      502,
      "AUTH_PROVIDER_UNAVAILABLE",
      "Supabase authentication is unavailable",
    );
  }

  if (!response.ok) {
    throw new AppError(
      response.status,
      "AUTH_REQUEST_FAILED",
      "Supabase rejected the authentication request",
    );
  }

  return response;
}
