import fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";

import { createAuthRoutes } from "./routes/auth.js";
