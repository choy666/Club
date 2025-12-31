import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonList, jsonSuccess } from "@/lib/http";
import { createEnrollment, listEnrollments } from "@/lib/enrollments/service";
import {
  createEnrollmentSchema,
  listEnrollmentsSchema,
} from "@/lib/validations/enrollments";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();

    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );

    const filters = listEnrollmentsSchema.parse({
      page: searchParams.page,
      perPage: searchParams.perPage,
      memberId: searchParams.memberId,
      status: searchParams.status,
      search: searchParams.search,
    });

    const result = await listEnrollments(filters);
    return jsonList(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();
    const input = createEnrollmentSchema.parse(payload);

    const enrollment = await createEnrollment(input);
    return jsonSuccess(enrollment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
