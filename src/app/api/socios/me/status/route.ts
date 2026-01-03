import { requireMemberSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { getMemberForUser } from "@/lib/members/service";
import { getMemberFinancialSnapshot } from "@/lib/enrollments/service";

export async function GET() {
  try {
    const session = await requireMemberSession();
    const member = await getMemberForUser(session.user.id);
    const snapshot = await getMemberFinancialSnapshot(member.id);

    return jsonSuccess(snapshot);
  } catch (error) {
    return handleApiError(error);
  }
}
