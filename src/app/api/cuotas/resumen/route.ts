import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { getMemberSummaries } from "@/lib/enrollments/service";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    console.log("🎯 [API] Solicitando resúmenes completos de socios con filtros:", { search });

    const summaries = await getMemberSummaries({ search });

    console.log(`✅ [API] Resúmenes generados: ${summaries.length} socios`);

    return jsonSuccess(summaries);
  } catch (error) {
    console.error("💥 [API] Error en generación de resúmenes:", error);
    return handleApiError(error);
  }
}
