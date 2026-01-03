import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { getEconomicConfigBySlug } from "@/lib/economic-config/service";
import { handleApiError, jsonSuccess } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const slug = request.nextUrl.searchParams.get("slug") ?? "default";
    const config = await getEconomicConfigBySlug(slug);
    return jsonSuccess(config);
  } catch (error) {
    return handleApiError(error);
  }
}
