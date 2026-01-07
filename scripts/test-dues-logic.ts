/**
 * Script para probar la lógica de cuotas y estados
 * Ejecutar con: npm run test:dues-logic
 */

import { db } from "@/db/client";
import { dues, members, users, enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";

async function testDuesLogic() {
  console.log("🧪 [TEST] Iniciando prueba de lógica de cuotas...\n");

  try {
    // 1. Obtener todas las cuotas con sus datos relacionados
    const allDues = await db
      .select({
        dues: {
          id: dues.id,
          dueDate: dues.dueDate,
          amount: dues.amount,
          status: dues.status,
          paidAt: dues.paidAt,
          createdAt: dues.createdAt,
          updatedAt: dues.updatedAt,
        },
        members: {
          id: members.id,
          documentNumber: members.documentNumber,
          status: members.status,
        },
        users: {
          name: users.name,
          email: users.email,
        },
        enrollments: {
          id: enrollments.id,
          startDate: enrollments.startDate,
          planName: enrollments.planName,
          monthlyAmount: enrollments.monthlyAmount,
        },
      })
      .from(dues)
      .innerJoin(members, eq(dues.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .orderBy(dues.dueDate)
      .limit(10);

    console.log("📊 [TEST] Muestra de cuotas encontradas:");
    allDues.forEach((item, index) => {
      const due = item.dues;
      const member = item.members;
      const user = item.users;
      const enrollment = item.enrollments;

      console.log(`\n--- Cuota ${index + 1} ---`);
      console.log(`ID: ${due.id}`);
      console.log(`Socio: ${user.name} (${member.documentNumber})`);
      console.log(`Estado: ${due.status}`);
      console.log(`Fecha vencimiento: ${due.dueDate}`);
      console.log(`Fecha pago: ${due.paidAt || "No pagado"}`);
      console.log(`Inscripción: ${enrollment.startDate} - $${enrollment.monthlyAmount}`);
    });

    // 2. Analizar estados por socio
    const memberStats = new Map();

    allDues.forEach((item) => {
      const memberId = item.members.id;
      const memberName = item.users.name || "Sin nombre";

      if (!memberStats.has(memberId)) {
        memberStats.set(memberId, {
          name: memberName,
          documentNumber: item.members.documentNumber,
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          frozen: 0,
          totalDebt: 0,
        });
      }

      const stats = memberStats.get(memberId);
      stats.total++;

      switch (item.dues.status) {
        case "PAID":
          stats.paid++;
          break;
        case "PENDING":
          stats.pending++;
          stats.totalDebt += item.dues.amount;
          break;
        case "OVERDUE":
          stats.overdue++;
          stats.totalDebt += item.dues.amount;
          break;
        case "FROZEN":
          stats.frozen++;
          break;
      }
    });

    console.log("\n📈 [TEST] Resumen por socio:");
    memberStats.forEach((stats) => {
      console.log(`\n--- Socio: ${stats.name} (${stats.documentNumber}) ---`);
      console.log(`Total cuotas: ${stats.total}`);
      console.log(`Pagadas: ${stats.paid}`);
      console.log(`Pendientes: ${stats.pending}`);
      console.log(`Vencidas: ${stats.overdue}`);
      console.log(`Congeladas: ${stats.frozen}`);
      console.log(`Deuda total: $${stats.totalDebt}`);

      // Calcular estado final
      let estado = "Al día";
      if (stats.overdue > 0) {
        estado = "En mora";
      } else if (stats.pending > 0) {
        estado = "Con pendientes";
      } else if (stats.frozen > 0) {
        estado = "Congelado";
      }
      console.log(`Estado calculado: ${estado}`);
    });

    // 3. Verificar lógica de fechas
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    console.log("\n📅 [TEST] Verificación de fechas:");
    console.log(`Fecha actual: ${todayStr}`);

    allDues.forEach((item) => {
      const due = item.dues;
      const isOverdue = due.status === "PENDING" && due.dueDate < todayStr;

      console.log(
        `Cuota ${due.id}: vence ${due.dueDate}, está vencida? ${isOverdue}, estado actual: ${due.status}`
      );

      if (isOverdue && due.status !== "OVERDUE") {
        console.warn(`⚠️ [TEST] Cuota ${due.id} debería estar OVERDUE pero está ${due.status}`);
      }

      if (!isOverdue && due.status === "OVERDUE") {
        console.warn(`⚠️ [TEST] Cuota ${due.id} está OVERDUE pero no debería estarlo`);
      }
    });

    console.log("\n✅ [TEST] Prueba completada exitosamente");
  } catch (error) {
    console.error("❌ [TEST] Error en prueba:", error);
  }
}

// Ejecutar la prueba
testDuesLogic().catch(console.error);
