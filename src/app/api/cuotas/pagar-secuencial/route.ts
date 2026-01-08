import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { paySequentialDues } from "@/lib/enrollments/service";
import { paySequentialDuesSchema } from "@/lib/validations/enrollments";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = paySequentialDuesSchema.parse(await request.json());

    console.log("💳 [API-PAGO] Endpoint POST /api/cuotas/pagar-secuencial llamado");
    console.log("📊 [API-PAGO] Input recibido:", input);
    console.log("📊 [API-PAGO] memberId:", input.memberId);
    console.log("📊 [API-PAGO] numberOfDues:", input.numberOfDues);
    console.log("📊 [API-PAGO] dueAmount:", input.dueAmount);

    const result = await paySequentialDues(input);

    console.log("✅ [API-PAGO] Pago procesado exitosamente");
    console.log("📊 [API-PAGO] Resultado:", result);
    console.log("📊 [API-PAGO] paidDues:", result.paidDues);
    console.log("📊 [API-PAGO] totalAmount:", result.totalAmount);
    console.log("📊 [API-PAGO] promotedToVitalicio:", result.promotedToVitalicio);

    return jsonSuccess(result);
  } catch (error) {
    console.error("❌ [API-PAGO] Error en endpoint de pago secuencial:", error);
    return handleApiError(error);
  }
}
