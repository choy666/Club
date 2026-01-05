import { ne, sql } from "drizzle-orm";

import "../src/lib/env";
import { db } from "../src/db/client";
import { dues, enrollments, members, payments } from "../src/db/schema";

async function main() {
  console.info("Iniciando limpieza total de inscripciones, cuotas y pagos...");

  const deletedPayments = await db.delete(payments).returning({ id: payments.id });
  console.info(`Pagos eliminados: ${deletedPayments.length}`);

  const deletedDues = await db.delete(dues).returning({ id: dues.id });
  console.info(`Cuotas eliminadas: ${deletedDues.length}`);

  const deletedEnrollments = await db.delete(enrollments).returning({ id: enrollments.id });
  console.info(`Inscripciones eliminadas: ${deletedEnrollments.length}`);

  const updatedMembers = await db
    .update(members)
    .set({ status: "PENDING", updatedAt: sql`now()` })
    .where(ne(members.status, "PENDING"))
    .returning({ id: members.id });

  console.info(`Estados de socios actualizados a PENDING: ${updatedMembers.length}`);
  console.info("Limpieza completada.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error durante la limpieza de inscripciones:", error);
    process.exit(1);
  });
