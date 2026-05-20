/* Centralised, validated access to environment variables.
   Importing this module fails fast at boot if required vars are missing. */

import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),

  WARFRAME_API_BASE: z.string().url().default("https://api.warframestat.us"),
  WARFRAME_PLATFORM: z.string().default("pc"),
  WARFRAME_CACHE_TTL: z.coerce.number().default(60),

  AI_PROVIDER: z.enum(["anthropic", "openai", "none"]).default("none"),
  AI_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default("claude-opus-4-7"),

  UPLOAD_DIR: z.string().default("./uploads"),
  UPLOAD_MAX_BYTES: z.coerce.number().default(10_485_760),

  NEXT_PUBLIC_SITE_URL: z.string().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export const aiEnabled = env.AI_PROVIDER !== "none" && env.AI_API_KEY.length > 0;
