import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  GET as listDuesHandler,
  POST as payDueHandler,
} from "@/app/api/cuotas/route";
import { AppError } from "@/lib/errors";

const mockListDues = vi.fn();
const mockPayDue = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "admin-id", role: "ADMIN" },
  }),
}));

vi.mock("@/lib/enrollments/service", () => ({
  listDues: (...args: unknown[]) => mockListDues(...args),
  payDue: (...args: unknown[]) => mockPayDue(...args),
}));

describe("GET /api/cuotas", () => {
  beforeEach(() => {
    mockListDues.mockReset();
  });

  it("devuelve la lista paginada de cuotas", async () => {
    mockListDues.mockResolvedValueOnce({
      data: [{ id: "due-1" }],
      meta: { page: 1, perPage: 10, total: 1, totalPages: 1 },
    });

    const request = new NextRequest(
      "http://localhost/api/cuotas?page=1&perPage=10",
    );
    const response = await listDuesHandler(request);

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.data).toHaveLength(1);
    expect(json.meta).toMatchObject({ page: 1, perPage: 10 });
    expect(mockListDues).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      status: undefined,
      memberId: undefined,
      enrollmentId: undefined,
      from: undefined,
      to: undefined,
    });
  });

  it("devuelve 422 con filtros inválidos", async () => {
    const request = new NextRequest(
      "http://localhost/api/cuotas?page=0&perPage=200",
    );
    const response = await listDuesHandler(request);

    expect(response.status).toBe(422);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("ValidationError");
  });
});

describe("POST /api/cuotas", () => {
  beforeEach(() => {
    mockPayDue.mockReset();
  });

  it("marca una cuota como pagada", async () => {
    mockPayDue.mockResolvedValueOnce({
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "PAID",
    });

    const request = new NextRequest("http://localhost/api/cuotas", {
      method: "POST",
      body: JSON.stringify({
        dueId: "123e4567-e89b-12d3-a456-426614174000",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await payDueHandler(request);

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.data).toMatchObject({
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "PAID",
    });
  });

  it("devuelve 422 cuando falta dueId", async () => {
    const request = new NextRequest("http://localhost/api/cuotas", {
      method: "POST",
      body: JSON.stringify({ paidAt: "2025-02-01" }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await payDueHandler(request);

    expect(response.status).toBe(422);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("ValidationError");
  });

  it("propaga AppError cuando no existe la cuota", async () => {
    mockPayDue.mockRejectedValueOnce(new AppError("Cuota inexistente.", 404));

    const request = new NextRequest("http://localhost/api/cuotas", {
      method: "POST",
      body: JSON.stringify({
        dueId: "123e4567-e89b-12d3-a456-426614174111",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await payDueHandler(request);
    expect(response.status).toBe(404);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("Cuota inexistente.");
  });
});
