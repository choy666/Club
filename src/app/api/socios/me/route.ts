import { requireMemberSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { getMemberForUser } from "@/lib/members/service";

export async function GET() {
  try {
    const session = await requireMemberSession();
    const member = await getMemberForUser(session.user.id);
    return jsonSuccess(member);
  } catch (error) {
    return handleApiError(error);
  }
}
