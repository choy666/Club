import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { memberIdSchema } from "@/lib/validations/members";
import { getMemberCredential } from "@/lib/enrollments/service";

export async function GET(_req: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  try {
    await requireAdminSession();
    const { memberId } = memberIdSchema.parse(await context.params);
    const credential = await getMemberCredential(memberId);
    return jsonSuccess(credential);
  } catch (error) {
    return handleApiError(error);
  }
}
