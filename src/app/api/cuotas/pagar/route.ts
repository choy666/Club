import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { payMultipleDues } from "@/lib/enrollments/service";
import { payDuesSchema } from "@/lib/validations/enrollments";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = payDuesSchema.parse(await request.json());
    const result = await payMultipleDues(input);
    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
