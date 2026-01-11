import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { count, eq, and, sql } from "drizzle-orm";
import { members, dues, enrollments, payments } from "@/db/schema";
import { getTodayLocal } from "@/lib/utils/date-utils";

export async function GET() {
  try {
    const today = getTodayLocal();
    const currentMonth = today.substring(0, 7); // YYYY-MM

    // Obtener estadísticas reales con lógica de negocio
    const [
      totalResult,
      // Regulares Activos (estado activo + plan regular)
      regularActivoResult,
      // Regulares Inactivos (estado activo + plan regular + cuota adeudada)
      regularInactivoResult,
      // Vitalicios Activos
      vitalicioActivoResult,
      // Vitalicios Inactivos (estado inactivo + 300+ pagos)
      vitalicioInactivoResult,
      // Pendientes
      pendingResult,
    ] = await Promise.all([
      // Total de socios (sin importar estado)
      db.select({ count: count() }).from(members),

      // Regulares Activos (estado activo + plan regular + primer mes cobertura o cuota del mes actual pagada)
      db
        .select({ count: count() })
        .from(members)
        .innerJoin(enrollments, eq(members.id, enrollments.memberId))
        .where(
          and(
            eq(members.status, "ACTIVE"),
            sql`${enrollments.planName} != 'VITALICIO'`,
            sql`(
            -- Caso 1: Recién inscriptos (primer mes de cobertura - siempre al día)
            (EXTRACT(MONTH FROM ${enrollments.startDate}) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(YEAR FROM ${enrollments.startDate}) = EXTRACT(YEAR FROM CURRENT_DATE))
            OR
            -- Caso 2: Cuota del mes actual pagada (al día)
            EXISTS (
              SELECT 1 FROM ${dues} 
              WHERE ${dues.enrollmentId} = ${enrollments.id} 
                AND ${dues.dueDate}::text LIKE ${currentMonth + "%"}
                AND ${dues.status} = 'PAID'
            )
          )`
          )
        ),

      // Regulares Inactivos (estado activo + plan regular + fuera de cobertura + cuota adeudada)
      db
        .select({ count: count() })
        .from(members)
        .innerJoin(enrollments, eq(members.id, enrollments.memberId))
        .where(
          and(
            eq(members.status, "ACTIVE"),
            sql`${enrollments.planName} != 'VITALICIO'`,
            sql`(
            -- NO es recién inscripto (fuera del primer mes de cobertura)
            NOT (
              EXTRACT(MONTH FROM ${enrollments.startDate}) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM ${enrollments.startDate}) = EXTRACT(YEAR FROM CURRENT_DATE)
            )
            AND
            -- Cuota del mes actual adeudada
            EXISTS (
              SELECT 1 FROM ${dues} 
              WHERE ${dues.enrollmentId} = ${enrollments.id} 
                AND ${dues.dueDate}::text LIKE ${currentMonth + "%"}
                AND ${dues.status} = 'PENDING'
            )
          )`
          )
        ),

      // Vitalicios Activos
      db.select({ count: count() }).from(members).where(eq(members.status, "VITALICIO")),

      // Vitalicios Inactivos (estado inactivo + 300+ pagos)
      db
        .select({ count: count() })
        .from(members)
        .where(
          and(
            eq(members.status, "INACTIVE"),
            sql`(
            EXISTS (
              SELECT 1 FROM ${payments} 
              WHERE ${payments.memberId} = ${members.id}
              GROUP BY ${payments.memberId}
              HAVING COUNT(*) >= 300
            )
          )`
          )
        ),

      // Pendientes
      db.select({ count: count() }).from(members).where(eq(members.status, "PENDING")),
    ]);

    const total = totalResult[0]?.count || 0;
    const regularActivo = regularActivoResult[0]?.count || 0;
    const regularInactivo = regularInactivoResult[0]?.count || 0;
    const vitalicioActivo = vitalicioActivoResult[0]?.count || 0;
    const vitalicioInactivo = vitalicioInactivoResult[0]?.count || 0;
    const pendientes = pendingResult[0]?.count || 0;

    // Logs para depuración
    console.log("=== ESTADÍSTICAS DE SOCIOS ===");
    console.log("Total socios:", total);
    console.log("Regulares Activos:", regularActivo);
    console.log("Regulares Inactivos:", regularInactivo);
    console.log("Vitalicios Activos:", vitalicioActivo);
    console.log("Vitalicios Inactivos:", vitalicioInactivo);
    console.log("Pendientes:", pendientes);
    console.log("Activos al Día (cálculo):", regularActivo + vitalicioActivo);
    console.log("==========================");

    // Calcular contadores según lógica especificada
    const stats = {
      total, // Total Socios = Regulares Activos + Regulares Inactivos + Vitalicios Activos + Vitalicios Inactivos + Pendientes
      activo: regularActivo + regularInactivo + vitalicioActivo, // Activos = Regulares Activos + Regulares Inactivos + Vitalicios Activos
      alDia: regularActivo + vitalicioActivo, // Activos al Día = Regulares Activos + Vitalicios Activos
      inactivo: regularInactivo + vitalicioInactivo, // Inactivos = Regulares Inactivos + Vitalicios Inactivos
      vitalicioActivo,
      vitalicioInactivo,
      pendiente: pendientes,
      deudores: 0, // TODO: Implementar lógica de deudores
      nuevosEsteMes: 0, // TODO: Implementar con filtro de fecha
      bajaEsteMes: 0, // TODO: Implementar con filtro de fecha
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("Error al obtener estadísticas de socios:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
