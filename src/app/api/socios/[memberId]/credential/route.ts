import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { memberIdSchema } from "@/lib/validations/members";
import { getMemberCredential } from "@/lib/enrollments/service";

export async function GET(_req: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  try {
    await requireAdminSession();
    const { memberId } = memberIdSchema.parse(await context.params);

    console.log("🔍 [API CREDENTIAL] Endpoint GET /api/socios/[memberId]/credential llamado");
    console.log("📊 [API CREDENTIAL] memberId:", memberId);

    const credential = await getMemberCredential(memberId);

    console.log("📥 [API CREDENTIAL] Credential obtenida:");
    console.log("  - credential:", credential);
    console.log("  - credential.member?.status:", credential?.member?.status);
    console.log("  - credential.enrollment?.planName:", credential?.enrollment?.planName);
    console.log("  - credential.isReady:", credential?.isReady);

    return jsonSuccess(credential);
  } catch (error) {
    console.error("❌ [API CREDENTIAL] Error:", error);
    return handleApiError(error);
  }
}
