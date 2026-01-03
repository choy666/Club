import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { memberIdSchema } from "@/lib/validations/members";
import { getMemberFinancialSnapshot } from "@/lib/enrollments/service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  try {
    await requireAdminSession();
    const { memberId } = memberIdSchema.parse(await context.params);
    const snapshot = await getMemberFinancialSnapshot(memberId);

    return jsonSuccess(snapshot);
  } catch (error) {
    return handleApiError(error);
  }
}
