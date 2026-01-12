import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { eq, and, ilike, desc, count, or, sql } from "drizzle-orm";
import { members, enrollments, users, dues, payments } from "@/db/schema";
import { getTodayLocal } from "@/lib/utils/date-utils";
import { isFirstMonthCoverage, isCurrentMonthDuePaid } from "@/lib/utils/member-status-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const debtStatus = searchParams.get("debtStatus") || "";

    const today = getTodayLocal();
    const currentMonth = today.substring(0, 7); // YYYY-MM

    console.log("API socios/list - Parámetros:", {
      page,
      limit,
      search,
      status,
      debtStatus,
      currentMonth,
    });

    // Construir condiciones de filtrado
    const conditions = [];

    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(members.documentNumber, `%${search}%`))
      );
    }

    if (status) {
      console.log(`API socios/list - Aplicando filtro status: ${status}`);
      // Mapeo de filtros a condiciones específicas
      if (status === "vitalicio-activo") {
        conditions.push(and(eq(members.status, "VITALICIO"), sql`${enrollments.id} IS NOT NULL`));
        console.log("→ Filtro vitalicio-activo aplicado");
      } else if (status === "vitalicio-inactivo") {
        // Para vitalicios inactivos, necesitamos una lógica más específica
        // que incluya tanto inscripción vitalicia como conteo de pagos DEL MISMO MIEMBRO
        conditions.push(
          and(
            eq(members.status, "INACTIVE"),
            sql`(
            ${enrollments.planName} = 'VITALICIO' OR
            EXISTS (
              SELECT 1 FROM ${payments} 
              WHERE ${payments.memberId} = ${members.id}
              GROUP BY ${payments.memberId}
              HAVING COUNT(*) >= 300
            )
          )`
          )
        );
        console.log("→ Filtro vitalicio-inactivo aplicado (con EXISTS específico por miembro)");
      } else if (status === "regular-activo") {
        // Socios regulares activos: incluye recién inscriptos y aquellos con cuota pagada
        conditions.push(
          and(
            eq(members.status, "ACTIVE"),
            sql`(${enrollments.planName} != 'VITALICIO' OR ${enrollments.planName} IS NULL)`,
            sql`(
            -- Caso 1: Recién inscripto (primer mes de cobertura)
            (EXTRACT(MONTH FROM ${enrollments.startDate}) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(YEAR FROM ${enrollments.startDate}) = EXTRACT(YEAR FROM CURRENT_DATE))
            OR
            -- Caso 2: Cuota del mes actual pagada
            EXISTS (
              SELECT 1 FROM ${dues} 
              WHERE ${dues.enrollmentId} = ${enrollments.id} 
                AND ${dues.dueDate}::text LIKE ${currentMonth + "%"}
                AND ${dues.status} = 'PAID'
            )
          )`
          )
        );
        console.log(
          "→ Filtro regular-activo aplicado (recién inscriptos + cuota mes actual pagada)"
        );
      } else if (status === "regular-inactivo") {
        // Socios regulares inactivos: solo aquellos fuera de cobertura con cuota adeudada
        conditions.push(
          and(
            eq(members.status, "ACTIVE"),
            sql`(${enrollments.planName} != 'VITALICIO' OR ${enrollments.planName} IS NULL)`,
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
        );
        console.log(
          "→ Filtro regular-inactivo aplicado (fuera de cobertura + cuota mes actual adeudada)"
        );
      } else if (status === "pendiente") {
        conditions.push(and(eq(members.status, "PENDING"), sql`${enrollments.id} IS NULL`));
        console.log("→ Filtro pendiente aplicado");
      } else if (status === "inactivo") {
        // Filtro para socios inactivos (excluye pendientes)
        // Incluye: Vitalicios Inactivos (status INACTIVE) + Regular Inactivos (status ACTIVE pero con cuota adeudada)
        // Excluye: Pendientes (status = PENDING)
        conditions.push(
          and(
            sql`(
            -- Caso 1: Socios con estado INACTIVE (vitalicios inactivos)
            ${members.status} = 'INACTIVE'
            OR
            -- Caso 2: Socios con estado ACTIVE pero con cuota del mes actual adeudada (regular inactivos)
            (
              ${members.status} = 'ACTIVE'
              AND ${enrollments.planName} != 'VITALICIO'
              AND EXISTS (
                SELECT 1 FROM ${dues} 
                WHERE ${dues.enrollmentId} = ${enrollments.id} 
                  AND ${dues.dueDate}::text LIKE ${currentMonth + "%"}
                  AND ${dues.status} = 'PENDING'
              )
              AND NOT (
                EXTRACT(MONTH FROM ${enrollments.startDate}) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM ${enrollments.startDate}) = EXTRACT(YEAR FROM CURRENT_DATE)
              )
            )
          )`
          )
        );
        console.log(
          "→ Filtro inactivo aplicado (incluye Vitalicios Inactivos + Regular Inactivos)"
        );
      } else {
        // Filtro legacy para compatibilidad
        const statusMap: Record<string, "ACTIVE" | "INACTIVE" | "PENDING"> = {
          activo: "ACTIVE",
          inactivo: "INACTIVE",
          pendiente: "PENDING",
        };
        const mappedStatus = statusMap[status];
        if (mappedStatus) {
          conditions.push(eq(members.status, mappedStatus));
          console.log(`→ Filtro legacy aplicado: ${status} -> ${mappedStatus}`);
        }
      }
    }

    if (debtStatus) {
      // Simplificado: por ahora todos como al_dia hasta implementar la lógica real
      // TODO: Implementar consulta compleja para determinar estado de cuotas
    }

    // Consulta principal con joins y lógica de estado
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    console.log("API socios/list - Ejecutando consulta con whereClause:", whereClause);

    const membersData = await db
      .select({
        id: members.id,
        nombre: users.name,
        dni: members.documentNumber,
        email: users.email,
        telefono: members.phone,
        estado: members.status,
        fechaIngreso: members.createdAt,
        plan: enrollments.planName,
        // Datos para determinar estado completo
        enrollmentId: enrollments.id,
        startDate: enrollments.startDate,
        currentDueStatus: sql<string>`
          CASE 
            WHEN ${members.status} = 'PENDING' THEN 'Pendiente'
            WHEN ${members.status} = 'INACTIVE' THEN 'Inactivo'
            WHEN ${members.status} = 'VITALICIO' THEN 'Vitalicio Activo'
            WHEN ${enrollments.planName} = 'VITALICIO' THEN 'Vitalicio Activo'
            ELSE 'Regular Activo'
          END
        `.as("estadoCompleto"),
      })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .leftJoin(enrollments, eq(members.id, enrollments.memberId))
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(members.createdAt));

    console.log("API socios/list - Consulta ejecutada, resultados:", membersData.length);

    // Para cada miembro, verificar su estado completo y estado de cuota
    const formattedMembers = await Promise.all(
      membersData.map(async (member) => {
        // Verificar si el miembro tiene alguna inscripción vitalicia
        const vitalicioEnrollment = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.memberId, member.id), eq(enrollments.planName, "VITALICIO")))
          .limit(1);

        const hasVitalicio = vitalicioEnrollment.length > 0;

        // Verificar cantidad de pagos para detectar vitalicio completado
        const paymentsCount = await db
          .select({ count: count() })
          .from(payments)
          .where(and(eq(payments.memberId, member.id), sql`${payments.memberId} IS NOT NULL`));

        const totalPagos = paymentsCount[0]?.count || 0;

        console.log(`=== MIEMBRO: ${member.nombre} ===`);
        console.log(`Estado DB: ${member.estado}`);
        console.log(`Plan: ${member.plan}`);
        console.log(`Fecha inscripción: ${member.startDate}`);
        console.log(`Tiene inscripción vitalicia: ${hasVitalicio}`);
        console.log(`Total de pagos: ${totalPagos}`);

        // Para cada miembro, determinar su estado completo usando la misma lógica que las credenciales
        let estadoCompleto = member.currentDueStatus || "Pendiente";

        // Verificar si está en primer mes de cobertura (recién inscripto)
        let isFirstMonth = false;
        if (member.startDate && member.estado === "ACTIVE") {
          // Crear un objeto mínimo con la propiedad necesaria
          const enrollmentData = {
            startDate: member.startDate,
            id: "",
            planName: member.plan || null,
            monthlyAmount: 0,
            status: "ACTIVE" as const,
            updatedAt: new Date().toISOString(),
          };
          isFirstMonth = isFirstMonthCoverage(enrollmentData);
        }

        // Verificar estado de cuota del mes actual usando la misma lógica que las credenciales
        let currentDuesForCheck: Array<{ dueDate: string; status: string }> = [];
        if (member.enrollmentId) {
          const currentMonthDues = await db
            .select()
            .from(dues)
            .where(
              and(
                eq(dues.enrollmentId, member.enrollmentId),
                sql`${dues.dueDate}::text LIKE ${currentMonth + "%"}`
              )
            );
          currentDuesForCheck = currentMonthDues;
        }

        // Usar la misma función que las credenciales para determinar si está al día
        const isCurrentMonthPaid =
          isCurrentMonthDuePaid(currentDuesForCheck, member.estado) || isFirstMonth;

        console.log(`Estado cuota mes actual: ${isCurrentMonthPaid ? "al_dia" : "deudor"}`);
        console.log(`Primer mes de cobertura: ${isFirstMonth}`);

        // Usar la misma lógica que las credenciales para determinar el estado
        if (member.estado === "INACTIVE") {
          if (hasVitalicio) {
            estadoCompleto = "Vitalicio Inactivo";
            console.log("→ Clasificado como Vitalicio Inactivo (tiene inscripción vitalicia)");
          } else if (totalPagos >= 300) {
            estadoCompleto = "Vitalicio Inactivo";
            console.log("→ Clasificado como Vitalicio Inactivo (tiene 300+ pagos)");
          } else {
            estadoCompleto = "Regular Inactivo";
            console.log("→ Clasificado como Regular Inactivo (no cumple criterios vitalicio)");
          }
        } else if (member.estado === "PENDING") {
          estadoCompleto = "Pendiente";
          console.log("→ Mantenido como Pendiente (estado PENDING)");
        } else if (member.estado === "ACTIVE") {
          // Determinar si es vitalicio
          if (hasVitalicio || totalPagos >= 300) {
            estadoCompleto = "Vitalicio Activo";
            console.log("→ Clasificado como Vitalicio Activo");
          } else {
            // Es un miembro regular - aplicar lógica de cobertura
            if (isFirstMonth) {
              // Recién inscripto: siempre está activo sin importar cuotas
              estadoCompleto = "Regular Activo";
              console.log("→ Clasificado como Regular Activo (primer mes de cobertura)");
            } else {
              // Fuera del período de cobertura: verificar cuota del mes actual
              if (isCurrentMonthPaid) {
                estadoCompleto = "Regular Activo";
                console.log("→ Clasificado como Regular Activo (cuota mes actual pagada)");
              } else {
                estadoCompleto = "Regular Inactivo";
                console.log("→ Clasificado como Regular Inactivo (cuota mes actual adeudada)");
              }
            }
          }
        } else if (member.estado === "VITALICIO") {
          estadoCompleto = "Vitalicio Activo";
          console.log("→ Clasificado como Vitalicio Activo (estado VITALICIO)");
        } else {
          console.log(`→ Mantenido como ${estadoCompleto} (estado especial: ${member.estado})`);
        }

        console.log(`Estado final: ${estadoCompleto}`);
        console.log("=== FIN MIEMBRO ===");

        return {
          id: member.id,
          nombre: member.nombre || "Sin nombre",
          dni: member.dni,
          email: member.email || "",
          telefono: member.telefono || "",
          estado: member.estado.toLowerCase(),
          estadoCompleto,
          estadoCuota: isCurrentMonthPaid ? "al_dia" : "deudor",
          fechaIngreso: member.fechaIngreso?.toISOString().split("T")[0] || "",
          plan: member.plan?.toLowerCase() || "mensual",
          ultimaCuota: null,
        };
      })
    );

    // Obtener total para paginación
    const totalCountResult = await db
      .select({ count: count() })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .leftJoin(enrollments, eq(members.id, enrollments.memberId))
      .where(whereClause);

    const total = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      data: formattedMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener lista de socios:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
