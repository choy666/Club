import { requireMemberSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { getMemberForUser } from "@/lib/members/service";
import { getMemberCredential } from "@/lib/enrollments/service";

export async function GET() {
  try {
    const session = await requireMemberSession();
    const member = await getMemberForUser(session.user.id);
    const credential = await getMemberCredential(member.id);

    return jsonSuccess(credential);
  } catch (error) {
    return handleApiError(error);
  }
}
