import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const envFiles = [".env.local", ".env"];

for (const file of envFiles) {
  const fullPath = resolve(process.cwd(), file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath, override: true });
  }
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  AUTH_ADMIN_EMAIL: z.string().email().optional(),
  AUTH_ADMIN_PASSWORD: z.string().min(8).optional(),
  AUTH_ADMIN_PASSWORD_HASH: z.string().min(60).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NAME_CLUB: z.string().min(1).default("Club"),
  ECONOMIC_DEFAULT_CURRENCY_CODE: z.string().min(3).max(3).default("ARS"),
  ECONOMIC_DEFAULT_MONTHLY_AMOUNT: z.coerce.number().int().positive().default(35000),
  ECONOMIC_DEFAULT_DUE_DAY: z.coerce.number().int().min(1).max(28).default(10),
  ECONOMIC_DEFAULT_LATE_FEE_PERCENTAGE: z.coerce.number().int().min(0).max(100).default(0),
  ECONOMIC_DEFAULT_GRACE_PERIOD_DAYS: z.coerce.number().int().min(0).max(31).default(5),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH_ADMIN_EMAIL: process.env.AUTH_ADMIN_EMAIL,
  AUTH_ADMIN_PASSWORD: process.env.AUTH_ADMIN_PASSWORD,
  AUTH_ADMIN_PASSWORD_HASH: process.env.AUTH_ADMIN_PASSWORD_HASH,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NAME_CLUB: process.env.NAME_CLUB,
  ECONOMIC_DEFAULT_CURRENCY_CODE: process.env.ECONOMIC_DEFAULT_CURRENCY_CODE,
  ECONOMIC_DEFAULT_MONTHLY_AMOUNT: process.env.ECONOMIC_DEFAULT_MONTHLY_AMOUNT,
  ECONOMIC_DEFAULT_DUE_DAY: process.env.ECONOMIC_DEFAULT_DUE_DAY,
  ECONOMIC_DEFAULT_LATE_FEE_PERCENTAGE: process.env.ECONOMIC_DEFAULT_LATE_FEE_PERCENTAGE,
  ECONOMIC_DEFAULT_GRACE_PERIOD_DAYS: process.env.ECONOMIC_DEFAULT_GRACE_PERIOD_DAYS,
});
