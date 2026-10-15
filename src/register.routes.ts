import type { FastifyInstance } from "fastify";

import type { AuthGateway } from "./modules/auth/types.js";
import { createAuthRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { createMeRoutes } from "./routes/me.js";
import { createWorkspaceRoutes } from "./routes/workspace.js";

// We are creating a route group to expose to the main entry file of the codebase
export function registerRoutes(
  app: FastifyInstance,
  authGateway: AuthGateway,
): void {
  app.register(healthRoutes);
  app.register(createAuthRoutes(authGateway));
  app.register(createMeRoutes(authGateway));
  app.register(createWorkspaceRoutes(authGateway));
}
