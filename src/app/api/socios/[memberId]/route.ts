import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import {
  deleteMember,
  getMemberById,
  updateMember,
} from "@/lib/members/service";
import { memberIdSchema, updateMemberSchema } from "@/lib/validations/members";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  try {
    await requireAdminSession();
    const { memberId } = memberIdSchema.parse(await context.params);
    const member = await getMemberById(memberId);
    return jsonSuccess(member);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  try {
    await requireAdminSession();
    const { memberId } = memberIdSchema.parse(await context.params);
    const payload = await request.json();
    const input = updateMemberSchema.parse(payload);

    const member = await updateMember(memberId, input);
    return jsonSuccess(member);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  try {
    await requireAdminSession();
    const { memberId } = memberIdSchema.parse(await context.params);
    await deleteMember(memberId);
    return jsonSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
