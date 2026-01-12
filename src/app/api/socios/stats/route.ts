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

      // Regulares Inactivos (estado active/inactive + plan regular + fuera de cobertura + sin cuota pagada)
      db
        .select({ count: count() })
        .from(members)
        .innerJoin(enrollments, eq(members.id, enrollments.memberId))
        .where(
          and(
            sql`(${members.status} = 'ACTIVE' OR ${members.status} = 'INACTIVE')`,
            sql`${enrollments.planName} != 'VITALICIO'`,
            sql`(
            -- NO es recién inscripto (fuera del primer mes de cobertura)
            NOT (
              EXTRACT(MONTH FROM ${enrollments.startDate}) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM ${enrollments.startDate}) = EXTRACT(YEAR FROM CURRENT_DATE)
            )
            AND
            -- Cuota del mes actual adeudada (PENDING o sin cuotas generadas)
            NOT EXISTS (
              SELECT 1 FROM ${dues} 
              WHERE ${dues.enrollmentId} = ${enrollments.id} 
                AND ${dues.dueDate}::text LIKE ${currentMonth + "%"}
                AND ${dues.status} = 'PAID'
            )
            AND
            -- Excluir vitalicios inactivos (los que tienen 300+ pagos)
            NOT EXISTS (
              SELECT 1 FROM ${payments} 
              WHERE ${payments.memberId} = ${members.id}
              GROUP BY ${payments.memberId}
              HAVING COUNT(*) >= 300
            )
          )`
          )
        ),

      // Vitalicios Activos (estado VITALICIO + estado ACTIVE con inscripción vitalicia)
      db
        .select({ count: count() })
        .from(members)
        .innerJoin(enrollments, eq(members.id, enrollments.memberId))
        .where(
          sql`(
            ${members.status} = 'VITALICIO' OR
            (${members.status} = 'ACTIVE' AND ${enrollments.planName} = 'VITALICIO')
          )`
        ),

      // Vitalicios Inactivos (estado INACTIVE + inscripción vitalicia OR 300+ pagos)
      db
        .select({ count: count() })
        .from(members)
        .leftJoin(enrollments, eq(members.id, enrollments.memberId))
        .where(
          and(
            eq(members.status, "INACTIVE"),
            sql`(
            EXISTS (
              SELECT 1 FROM ${enrollments} 
              WHERE ${enrollments.memberId} = ${members.id}
              AND ${enrollments.planName} = 'VITALICIO'
            ) OR
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
      total, // Total Socios = Todos los socios existentes
      activo: regularActivo + regularInactivo + vitalicioActivo, // Activos = Vitalicio Activo + Regular Activo + Regular Inactivo
      alDia: regularActivo + vitalicioActivo, // Activos al Día = Regular Activo + Vitalicio Activo
      inactivo: regularInactivo + vitalicioInactivo, // Inactivos = Regular Inactivo + Vitalicio Inactivo
      vitalicioActivo,
      vitalicioInactivo,
      pendiente: pendientes,
      deudores: regularInactivo, // Deudores = Regular Inactivo
      nuevosEsteMes: 0, // TODO: Implementar con filtro de fecha
      bajaEsteMes: 0, // TODO: Implementar con filtro de fecha
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("Error al obtener estadísticas de socios:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
