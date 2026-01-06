import { db } from "@/db/client";
import { dues, enrollments, members } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Script para corregir inconsistencias entre member_id de cuotas e inscripciones
 */

async function fixInconsistentMemberIds() {
  console.log("🔧 Iniciando corrección de member_id inconsistentes...");

  try {
    // 1. Identificar cuotas con member_id inconsistente
    const inconsistentDues = await db
      .select({
        dueId: dues.id,
        dueMemberId: dues.memberId,
        enrollmentId: dues.enrollmentId,
        enrollmentMemberId: enrollments.memberId,
        memberName: sql`users.name`,
      })
      .from(dues)
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .innerJoin(members, eq(enrollments.memberId, members.id))
      .innerJoin(sql`users`, sql`members.user_id = users.id`)
      .where(sql`dues.member_id != enrollments.member_id`)
      .limit(10); // Limitar para ver ejemplos

    console.log("🔍 Ejemplos de inconsistencias encontradas:");
    console.table(inconsistentDues);

    // 2. Contar total de inconsistencias
    const totalCountResult = await db
      .select({ count: sql`count(*)` })
      .from(dues)
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(sql`dues.member_id != enrollments.member_id`);

    const totalCount = Number(totalCountResult[0]?.count) || 0;
    console.log(`📊 Total de inconsistencias: ${totalCount}`);

    if (totalCount > 0) {
      // 3. Corregir todas las inconsistencias
      console.log("🔧 Corrigiendo inconsistencias...");

      const fixResult = await db
        .update(dues)
        .set({
          memberId: sql`enrollments.member_id`,
        })
        .from(dues)
        .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
        .where(sql`dues.member_id != enrollments.member_id`);

      console.log(`✅ Corregidas ${Number(fixResult.rowCount)} inconsistencias de member_id`);
    } else {
      console.log("✅ No se encontraron inconsistencias de member_id");
    }

    // 4. Verificar si hay cuotas sin inscripción
    const orphanedDues = await db
      .select({ count: sql`count(*)` })
      .from(dues)
      .where(sql`dues.enrollment_id NOT IN (SELECT id FROM enrollments)`);

    const orphanedCount = Number(orphanedDues[0]?.count) || 0;

    if (orphanedCount > 0) {
      console.log(`🧹 Eliminando ${orphanedCount} cuotas huérfanas...`);

      const deleteResult = await db
        .delete(dues)
        .where(sql`dues.enrollment_id NOT IN (SELECT id FROM enrollments)`);

      console.log(`✅ Eliminadas ${Number(deleteResult.rowCount)} cuotas huérfanas`);
    }

    console.log("🎉 Corrección completada exitosamente");

    return {
      inconsistentFixed: totalCount,
      orphanedDeleted: orphanedCount,
      total: totalCount + orphanedCount,
    };
  } catch (error) {
    console.error("❌ Error durante la corrección:", error);
    throw error;
  }
}

// Ejecutar la corrección
if (require.main === module) {
  fixInconsistentMemberIds()
    .then((result) => {
      console.log(`📊 Resumen: ${result.total} problemas corregidos en total`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}

export { fixInconsistentMemberIds };
