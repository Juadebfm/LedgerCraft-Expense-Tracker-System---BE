import "dotenv/config";

import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  CORS_ORIGIN: z.string().url().optional().default("http://localhost:5173"),
  EMAIL_CONFIRMATION_REDIRECT_URL: z.string().url().optional(),
  PASSWORD_RECOVERY_REDIRECT_URL: z.string().url().optional(),
  INVITATION_REDIRECT_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  EXCHANGE_RATE_API_KEY: z.string().min(1).optional(),
});

export const env = environmentSchema.parse(process.env);
