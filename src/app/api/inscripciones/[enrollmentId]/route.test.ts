import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import { DELETE as deleteEnrollmentHandler } from "@/app/api/inscripciones/[enrollmentId]/route";
import { AppError } from "@/lib/errors";

const mockDeleteEnrollment = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "admin-id", role: "ADMIN" },
  }),
}));

vi.mock("@/lib/enrollments/service", () => ({
  deleteEnrollment: (...args: unknown[]) => mockDeleteEnrollment(...args),
}));

function buildContext(enrollmentId: string) {
  return {
    params: Promise.resolve({ enrollmentId }),
  } satisfies Parameters<typeof deleteEnrollmentHandler>[1];
}

describe("DELETE /api/inscripciones/{enrollmentId}", () => {
  beforeEach(() => {
    mockDeleteEnrollment.mockReset();
  });

  it("elimina la inscripción y devuelve 200", async () => {
    const enrollmentId = "123e4567-e89b-12d3-a456-426614174000";
    const enrollment = { id: enrollmentId, memberId: "member-1" };
    mockDeleteEnrollment.mockResolvedValueOnce(enrollment);

    const response = await deleteEnrollmentHandler(
      new NextRequest(`http://localhost/api/inscripciones/${enrollmentId}`, {
        method: "DELETE",
      }),
      buildContext(enrollmentId)
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.data).toMatchObject(enrollment);
    expect(mockDeleteEnrollment).toHaveBeenCalledWith(enrollmentId);
  });

  it("propaga AppError cuando hay cuotas pagadas", async () => {
    const enrollmentId = "123e4567-e89b-12d3-a456-426614174111";
    mockDeleteEnrollment.mockRejectedValueOnce(
      new AppError("No se puede eliminar una inscripción que tiene cuotas pagadas.", 409)
    );

    const response = await deleteEnrollmentHandler(
      new NextRequest(`http://localhost/api/inscripciones/${enrollmentId}`, {
        method: "DELETE",
      }),
      buildContext(enrollmentId)
    );

    expect(response.status).toBe(409);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("No se puede eliminar una inscripción que tiene cuotas pagadas.");
    expect(mockDeleteEnrollment).toHaveBeenCalledWith(enrollmentId);
  });
});
