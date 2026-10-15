import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { Redis } from "ioredis";

import { env } from "./config/env.js";
import { securityPolicy } from "./config/security.js";
import { AppError } from "./lib/app-error.js";

// Registers the application-wide CORS, security-header, and rate-limit protections.
export function registerApplicationSecurity(app: FastifyInstance): void {
  app.register(cors, {
    origin: env.CORS_ORIGIN,
  });

  app.register(helmet);

  const redis = env.RATE_LIMIT_REDIS_URL
    ? new Redis(env.RATE_LIMIT_REDIS_URL, {
        connectTimeout: 1_000,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      })
    : undefined;

  app.register(rateLimit, {
    global: true,
    max: securityPolicy.api.max,
    timeWindow: securityPolicy.api.timeWindow,
    ...(redis ? { redis } : {}),
    addHeaders: {
      "retry-after": true,
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    addHeadersOnExceeding: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    errorResponseBuilder: () =>
      new AppError(429, "RATE_LIMITED", "Too many requests. Try again later."),
  });

  if (redis) {
    app.addHook("onClose", () => {
      redis.disconnect();
    });
  }
}
