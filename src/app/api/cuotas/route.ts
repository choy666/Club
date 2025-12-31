import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonList, jsonSuccess } from "@/lib/http";
import { listDues, payDue } from "@/lib/enrollments/service";
import {
  dueIdSchema,
  listDuesSchema,
  payDueSchema,
} from "@/lib/validations/enrollments";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();

    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );

    const filters = listDuesSchema.parse({
      page: searchParams.page,
      perPage: searchParams.perPage,
      status: searchParams.status,
      memberId: searchParams.memberId,
      enrollmentId: searchParams.enrollmentId,
      from: searchParams.from,
      to: searchParams.to,
    });

    const result = await listDues(filters);
    return jsonList(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();

    const { dueId } = dueIdSchema.parse({ dueId: payload.dueId });
    const { paidAt } = payDueSchema.parse({
      paidAt: payload.paidAt,
    });

    const due = await payDue(dueId, paidAt);
    return jsonSuccess(due);
  } catch (error) {
    return handleApiError(error);
  }
}
