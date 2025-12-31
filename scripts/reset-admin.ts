import { eq } from "drizzle-orm";

import "../src/lib/env";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";

async function main() {
  const admins = await db.select().from(users).where(eq(users.role, "ADMIN"));

  if (admins.length === 0) {
    console.info("No hay usuarios ADMIN registrados.");
    return;
  }

  await db.delete(users).where(eq(users.role, "ADMIN"));

  console.info(`Se eliminaron ${admins.length} usuarios ADMIN.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
