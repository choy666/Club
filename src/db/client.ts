import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

const neonClient = neon(env.DATABASE_URL);

export const db = drizzle({
  client: neonClient,
  schema,
});
