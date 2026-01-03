import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { reportFiltersSchema } from "@/lib/validations/reports";
import { getReports } from "@/lib/reports/service";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();
    const filters = reportFiltersSchema.parse(payload);
    const report = await getReports(filters);
    return jsonSuccess(report);
  } catch (error) {
    return handleApiError(error);
  }
}
