import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { deleteEnrollment, getEnrollmentDetail, updateEnrollment } from "@/lib/enrollments/service";
import { enrollmentIdSchema, updateEnrollmentSchema } from "@/lib/validations/enrollments";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    await requireAdminSession();
    const { enrollmentId } = enrollmentIdSchema.parse(await context.params);
    const enrollment = await getEnrollmentDetail(enrollmentId);
    return jsonSuccess(enrollment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    await requireAdminSession();
    const { enrollmentId } = enrollmentIdSchema.parse(await context.params);
    const enrollment = await deleteEnrollment(enrollmentId);
    return jsonSuccess(enrollment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    await requireAdminSession();
    const { enrollmentId } = enrollmentIdSchema.parse(await context.params);
    const payload = await request.json();
    const input = updateEnrollmentSchema.parse(payload);

    const enrollment = await updateEnrollment(enrollmentId, input);
    return jsonSuccess(enrollment);
  } catch (error) {
    return handleApiError(error);
  }
}
