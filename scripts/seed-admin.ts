import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFiles = [".env.local", ".env"];

for (const file of envFiles) {
  const fullPath = resolve(process.cwd(), file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath, override: true });
  }
}

import { eq } from "drizzle-orm";

import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { env } from "../src/lib/env";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = env.AUTH_ADMIN_EMAIL?.toLowerCase().trim();

  if (!email) {
    throw new Error(
      "Debes definir AUTH_ADMIN_EMAIL en tu archivo .env.local o variables de entorno."
    );
  }

  let passwordHash = env.AUTH_ADMIN_PASSWORD_HASH;
  let passwordSource: "plain" | "hash" | null = null;

  if (env.AUTH_ADMIN_PASSWORD) {
    passwordHash = await hashPassword(env.AUTH_ADMIN_PASSWORD);
    passwordSource = "plain";
  } else if (env.AUTH_ADMIN_PASSWORD_HASH) {
    passwordSource = "hash";
  }

  if (!passwordHash) {
    throw new Error(
      "Debes definir AUTH_ADMIN_PASSWORD (texto plano) o AUTH_ADMIN_PASSWORD_HASH (hash bcrypt)."
    );
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    await db
      .update(users)
      .set({
        role: "ADMIN",
        passwordHash: passwordSource === null ? existing.passwordHash : passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    console.info(
      `Usuario existente ${email} actualizado como ADMIN${
        passwordSource ? " y contraseña sincronizada." : "."
      }`
    );
    return;
  }

  await db.insert(users).values({
    email,
    role: "ADMIN",
    passwordHash,
    name: "Administrador",
  });

  console.info(`Usuario administrador ${email} creado correctamente.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
