import { db } from "@/db/client";
import { dues, enrollments, members, users } from "@/db/schema";
import { eq, sql, or } from "drizzle-orm";

/**
 * Script de diagnóstico completo para el error de cuotas
 */

async function diagnoseDuesError() {
  console.log("🔍 Iniciando diagnóstico completo del error de cuotas...");

  try {
    // 1. Verificar estructura de tablas
    console.log("\n📊 1. Verificando estructura de datos...");

    const totalDues = await db.select({ count: sql`count(*)` }).from(dues);
    const totalEnrollments = await db.select({ count: sql`count(*)` }).from(enrollments);
    const totalMembers = await db.select({ count: sql`count(*)` }).from(members);

    console.log(`Total cuotas: ${totalDues[0]?.count}`);
    console.log(`Total inscripciones: ${totalEnrollments[0]?.count}`);
    console.log(`Total socios: ${totalMembers[0]?.count}`);

    // 2. Verificar relaciones directas
    console.log("\n🔗 2. Verificando relaciones...");

    // Buscar cuotas con problemas
    const problematicDues = await db
      .select({
        dueId: dues.id,
        dueEnrollmentId: dues.enrollmentId,
        dueMemberId: dues.memberId,
        enrollmentExists: sql`CASE WHEN enrollments.id IS NOT NULL THEN 1 ELSE 0 END`,
        memberExists: sql`CASE WHEN members.id IS NOT NULL THEN 1 ELSE 0 END`,
        userExists: sql`CASE WHEN users.id IS NOT NULL THEN 1 ELSE 0 END`,
        enrollmentMemberId: enrollments.memberId,
        memberName: users.name,
      })
      .from(dues)
      .leftJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .leftJoin(members, eq(dues.memberId, members.id))
      .leftJoin(users, eq(members.userId, users.id))
      .where(
        or(
          sql`enrollments.id IS NULL`,
          sql`members.id IS NULL`,
          sql`users.id IS NULL`,
          sql`dues.member_id != enrollments.member_id`
        )
      )
      .limit(10);

    if (problematicDues.length > 0) {
      console.log("❌ Cuotas con problemas encontradas:");
      console.table(problematicDues);
    } else {
      console.log("✅ No se encontraron problemas obvios en las relaciones");
    }

    // 3. Verificar la consulta exacta que falla
    console.log("\n🧪 3. Ejecutando consulta exacta que falla...");

    try {
      const testQuery = await db
        .select()
        .from(dues)
        .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
        .innerJoin(members, eq(dues.memberId, members.id))
        .innerJoin(users, eq(members.userId, users.id))
        .orderBy(dues.dueDate)
        .limit(50);

      console.log(`✅ Consulta exitosa: ${testQuery.length} resultados`);

      if (testQuery.length > 0) {
        console.log("📋 Primeros 3 resultados:");
        console.table(testQuery.slice(0, 3));
      }
    } catch (queryError) {
      console.error("❌ Error en la consulta de prueba:");
      console.error(queryError);

      // 4. Intentar consulta simplificada
      console.log("\n🔧 4. Intentando consulta simplificada...");

      try {
        const simpleQuery = await db
          .select({
            dueId: dues.id,
            enrollmentId: dues.enrollmentId,
            memberId: dues.memberId,
            dueDate: dues.dueDate,
          })
          .from(dues)
          .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
          .orderBy(dues.dueDate)
          .limit(5);

        console.log(`✅ Consulta simplificada exitosa: ${simpleQuery.length} resultados`);
        console.table(simpleQuery);
      } catch (simpleError) {
        console.error("❌ Error incluso en consulta simplificada:");
        console.error(simpleError);
      }
    }

    // 5. Verificar datos específicos que causan problemas
    console.log("\n🎯 5. Buscando patrones problemáticos...");

    // Buscar cuotas con member_id nulo o inválido
    const nullMemberIds = await db
      .select({ count: sql`count(*)` })
      .from(dues)
      .where(
        or(
          sql`dues.member_id IS NULL`,
          sql`dues.member_id = ''`,
          sql`dues.enrollment_id IS NULL`,
          sql`dues.enrollment_id = ''`
        )
      );

    console.log(`Cuotas con IDs nulos: ${nullMemberIds[0]?.count || 0}`);

    // Buscar inscripciones sin cuotas
    const enrollmentsWithoutDues = await db
      .select({ count: sql`count(*)` })
      .from(enrollments)
      .where(sql`NOT EXISTS (SELECT 1 FROM dues WHERE dues.enrollment_id = enrollments.id)`);

    console.log(`Inscripciones sin cuotas: ${enrollmentsWithoutDues[0]?.count || 0}`);

    console.log("\n🎉 Diagnóstico completado");
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
    throw error;
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  diagnoseDuesError()
    .then(() => {
      console.log("\n📊 Diagnóstico completado. Revisa los resultados arriba.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}

export { diagnoseDuesError };
