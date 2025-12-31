import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_ADMIN_EMAIL: z.string().email().optional(),
  AUTH_ADMIN_PASSWORD_HASH: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_ADMIN_EMAIL: process.env.AUTH_ADMIN_EMAIL,
  AUTH_ADMIN_PASSWORD_HASH: process.env.AUTH_ADMIN_PASSWORD_HASH,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
