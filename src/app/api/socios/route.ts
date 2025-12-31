import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonList, jsonSuccess } from "@/lib/http";
import { createMember, listMembers } from "@/lib/members/service";
import {
  createMemberSchema,
  listMembersSchema,
} from "@/lib/validations/members";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();

    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );

    const filters = listMembersSchema.parse({
      page: searchParams.page,
      perPage: searchParams.perPage,
      status: searchParams.status,
      search: searchParams.search,
    });

    const result = await listMembers(filters);
    return jsonList(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();
    const input = createMemberSchema.parse(payload);

    const member = await createMember(input);

    return jsonSuccess(member, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
