import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { getMemberPaymentsGrouped } from "@/lib/enrollments/service";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requireAdminSession();
    const { memberId } = await params;

    console.log("🔍 [API] Endpoint GET /api/socios/[memberId]/payments llamado");
    console.log("📊 [API] memberId:", memberId);

    const payments = await getMemberPaymentsGrouped(memberId);

    console.log("📥 [API] Pagos agrupados obtenidos:", payments);
    console.log("📊 [API] Cantidad de pagos:", payments.length);

    return jsonSuccess(payments);
  } catch (error) {
    console.error("❌ [API] Error en endpoint de pagos:", error);
    return handleApiError(error);
  }
}
