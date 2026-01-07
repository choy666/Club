import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { getMemberSummaries } from "@/lib/enrollments/service";

export async function GET() {
  try {
    await requireAdminSession();

    console.log("🎯 [API] Solicitando resúmenes completos de socios...");

    const summaries = await getMemberSummaries();

    console.log(`✅ [API] Resúmenes generados: ${summaries.length} socios`);

    return jsonSuccess(summaries);
  } catch (error) {
    console.error("💥 [API] Error en generación de resúmenes:", error);
    return handleApiError(error);
  }
}
