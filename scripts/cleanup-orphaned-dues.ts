import { db } from "@/db/client";
import { dues } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Script para limpiar cuotas huérfanas e inconsistentes
 * después de eliminar inscripciones
 */

async function cleanupOrphanedDues() {
  console.log("🧹 Iniciando limpieza de cuotas huérfanas...");

  try {
    // 1. Eliminar cuotas donde la inscripción ya no existe
    const orphanedByEnrollment = await db
      .delete(dues)
      .where(sql`dues.enrollment_id NOT IN (SELECT id FROM enrollments)`);

    const result1 = await orphanedByEnrollment;
    console.log(`✅ Eliminadas ${result1.rowCount} cuotas huérfanas por inscripción`);

    // 2. Eliminar cuotas donde el miembro no existe
    const orphanedByMember = await db
      .delete(dues)
      .where(sql`dues.member_id NOT IN (SELECT id FROM members)`);

    const result2 = await orphanedByMember;
    console.log(`✅ Eliminadas ${result2.rowCount} cuotas huérfanas por miembro`);

    // 3. Eliminar cuotas con member_id inconsistente
    const inconsistentDues = await db
      .delete(dues)
      .where(
        sql`dues.member_id != (SELECT member_id FROM enrollments WHERE enrollments.id = dues.enrollment_id)`
      );

    const result3 = await inconsistentDues;
    console.log(`✅ Eliminadas ${result3.rowCount} cuotas con member_id inconsistente`);

    console.log("🎉 Limpieza completada exitosamente");

    return {
      orphanedByEnrollment: result1.rowCount || 0,
      orphanedByMember: result2.rowCount || 0,
      inconsistentDues: result3.rowCount || 0,
      total: (result1.rowCount || 0) + (result2.rowCount || 0) + (result3.rowCount || 0),
    };
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  }
}

// Ejecutar la limpieza
if (require.main === module) {
  cleanupOrphanedDues()
    .then((result) => {
      console.log(`📊 Resumen: ${result.total} cuotas eliminadas en total`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}

export { cleanupOrphanedDues };
