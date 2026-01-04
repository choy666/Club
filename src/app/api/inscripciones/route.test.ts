import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  GET as listEnrollmentsHandler,
  POST as createEnrollmentHandler,
} from "@/app/api/inscripciones/route";
import { AppError } from "@/lib/errors";

const mockCreateEnrollment = vi.fn();
const mockListEnrollments = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "admin-id", role: "ADMIN" },
  }),
}));

vi.mock("@/lib/enrollments/service", () => ({
  createEnrollment: (...args: unknown[]) => mockCreateEnrollment(...args),
  listEnrollments: (...args: unknown[]) => mockListEnrollments(...args),
}));

function buildPostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/inscripciones", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("GET /api/inscripciones", () => {
  beforeEach(() => {
    mockListEnrollments.mockReset();
  });

  it("devuelve la lista paginada de inscripciones", async () => {
    mockListEnrollments.mockResolvedValueOnce({
      data: [{ id: "enroll-1" }],
      meta: { page: 2, perPage: 20, total: 1, totalPages: 1 },
    });

    const request = new NextRequest(
      "http://localhost/api/inscripciones?page=2&perPage=20&status=ACTIVE&search=juan"
    );

    const response = await listEnrollmentsHandler(request);

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.data).toHaveLength(1);
    expect(json.meta).toMatchObject({ page: 2, perPage: 20 });
    expect(mockListEnrollments).toHaveBeenCalledWith({
      page: 2,
      perPage: 20,
      memberId: undefined,
      status: "ACTIVE",
      search: "juan",
    });
  });

  it("devuelve 422 con filtros inválidos", async () => {
    const request = new NextRequest("http://localhost/api/inscripciones?page=0&perPage=200");

    const response = await listEnrollmentsHandler(request);

    expect(response.status).toBe(422);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("ValidationError");
    expect(mockListEnrollments).not.toHaveBeenCalled();
  });
});

describe("POST /api/inscripciones", () => {
  beforeEach(() => {
    mockCreateEnrollment.mockReset();
  });

  it("returns 201 con los datos de la inscripción creada", async () => {
    const payload = {
      memberId: "123e4567-e89b-12d3-a456-426614174000",
      startDate: "2025-02-01",
      monthlyAmount: 45000,
      monthsToGenerate: 6,
    };

    mockCreateEnrollment.mockResolvedValueOnce({
      id: "enroll-1",
      memberId: payload.memberId,
    });

    const response = await createEnrollmentHandler(buildPostRequest(payload));

    expect(response.status).toBe(201);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.data).toMatchObject({
      id: "enroll-1",
      memberId: payload.memberId,
    });
    expect(mockCreateEnrollment).toHaveBeenCalledWith(payload);
  });

  it("devuelve 422 cuando el payload es inválido", async () => {
    const response = await createEnrollmentHandler(
      buildPostRequest({
        memberId: "not-a-uuid",
        startDate: "fecha inválida",
      })
    );

    expect(response.status).toBe(422);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("ValidationError");
    expect(json.details).toBeInstanceOf(Array);
  });

  it("propaga AppError cuando el servicio falla", async () => {
    mockCreateEnrollment.mockRejectedValueOnce(new AppError("Socio no encontrado.", 404));

    const response = await createEnrollmentHandler(
      buildPostRequest({
        memberId: "123e4567-e89b-12d3-a456-426614174111",
        startDate: "2025-02-01",
      })
    );

    expect(response.status).toBe(404);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("Socio no encontrado.");
  });
});
