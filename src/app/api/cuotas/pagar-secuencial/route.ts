import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { paySequentialDues } from "@/lib/enrollments/service";
import { paySequentialDuesSchema } from "@/lib/validations/enrollments";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = paySequentialDuesSchema.parse(await request.json());
    const result = await paySequentialDues(input);
    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
