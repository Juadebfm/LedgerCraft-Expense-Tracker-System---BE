import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";

import { registerErrorHandler } from "./configure-error-handler.js";
import { registerApplicationSecurity } from "./configure-security.js";
import { registerUploadHandling } from "./configure-uploads.js";
import { registerRoutes } from "./register.routes.js";
import { createSupabaseAuthGateway } from "./modules/auth/supabase-gateway.js";

import type { AuthGateway } from "./modules/auth/types.js";

// this will be used by the server (running) and in-memory

export function buildApp(
  options: { authGateway?: AuthGateway } = {},
): FastifyInstance {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
    // A request that starts in a browser almost never goes straight into an application’s servlet container. It travels through one or more layers of infrastructure like reverse proxies, load balancers, or security appliances. Each layer has a chance to adjust the request, attach extra headers, or strip away ones it doesn’t want downstream systems to see. Proxies don’t alter requests at random and instead they follow conventions that help backend services reconstruct what the client originally sent.

    trustProxy: env.TRUST_PROXY,
  });

  const authGateway = options.authGateway ?? createSupabaseAuthGateway();

  registerApplicationSecurity(app);
  registerUploadHandling(app);
  registerErrorHandler(app);
  registerRoutes(app, authGateway);

  return app;
}
