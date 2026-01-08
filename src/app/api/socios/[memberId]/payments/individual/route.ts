import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { getMemberPaymentsByTransaction } from "@/lib/enrollments/service";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requireAdminSession();
    const { memberId } = await params;

    console.log("🔍 [API] Endpoint GET /api/socios/[memberId]/payments/individual llamado");
    console.log("📊 [API] memberId:", memberId);

    const transactions = await getMemberPaymentsByTransaction(memberId);

    console.log("📥 [API] Transacciones obtenidas:", transactions);
    console.log("📊 [API] Cantidad de transacciones:", transactions.length);

    return jsonSuccess(transactions);
  } catch (error) {
    console.error("❌ [API] Error en endpoint de transacciones:", error);
    return handleApiError(error);
  }
}
