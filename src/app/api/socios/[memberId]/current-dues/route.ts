import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { db } from "@/db/client";
import { dues } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getTodayLocal, fromLocalDateOnly } from "@/lib/utils/date-utils";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requireAdminSession();
    const { memberId } = await params;

    console.log("🔍 [API] Endpoint GET /api/socios/[memberId]/current-dues llamado");
    console.log("📊 [API] memberId:", memberId);

    // Obtener fecha actual y límites del mes actual
    const todayStr = getTodayLocal();
    const today = fromLocalDateOnly(todayStr);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0); // Último día del mes

    // Convertir fechas a formato YYYY-MM-DD para la consulta
    const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
    const lastDayStr = lastDayOfMonth.toISOString().split("T")[0];

    // Obtener cuotas del mes actual
    const currentMonthDues = await db
      .select({
        id: dues.id,
        dueDate: dues.dueDate,
        status: dues.status,
        amount: dues.amount,
        paidAt: dues.paidAt,
      })
      .from(dues)
      .where(
        and(
          eq(dues.memberId, memberId),
          gte(dues.dueDate, firstDayStr),
          lte(dues.dueDate, lastDayStr)
        )
      );

    console.log("📥 [API] Cuotas del mes actual:", currentMonthDues);

    return jsonSuccess({
      dues: currentMonthDues,
      isCurrentMonthPaid: currentMonthDues.some((due) => due.status === "PAID"),
      currentMonth: {
        year: currentYear,
        month: currentMonth + 1,
        firstDay: firstDayStr,
        lastDay: lastDayStr,
      },
    });
  } catch (error) {
    console.error(" [API] Error en endpoint de cuotas actuales:", error);
    return handleApiError(error);
  }
}
