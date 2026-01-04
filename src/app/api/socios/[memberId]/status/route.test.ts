import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { GET as memberStatusHandler } from "@/app/api/socios/[memberId]/status/route";
import { AppError } from "@/lib/errors";

const mockGetMemberFinancialSnapshot = vi.fn();
const mockMemberIdSchemaParse = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "admin-id", role: "ADMIN" },
  }),
}));

vi.mock("@/lib/enrollments/service", () => ({
  getMemberFinancialSnapshot: (...args: unknown[]) => mockGetMemberFinancialSnapshot(...args),
}));

vi.mock("@/lib/validations/members", () => ({
  memberIdSchema: {
    parse: (...args: unknown[]) => mockMemberIdSchemaParse(...args),
  },
}));

function buildContext(memberId: string) {
  return {
    params: Promise.resolve({ memberId }),
  } satisfies Parameters<typeof memberStatusHandler>[1];
}

describe("GET /api/socios/{memberId}/status", () => {
  beforeEach(() => {
    mockGetMemberFinancialSnapshot.mockReset();
    mockMemberIdSchemaParse.mockReset();
    mockMemberIdSchemaParse.mockImplementation((value) => value);
  });

  it("devuelve el snapshot financiero reconciliado", async () => {
    const memberId = "123e4567-e89b-12d3-a456-426614174000";
    const snapshot = {
      memberId,
      status: "INACTIVE",
      totals: { pending: 1, overdue: 2, paid: 5 },
      nextDueDate: "2025-02-10",
      gracePeriodDays: 5,
    };

    mockGetMemberFinancialSnapshot.mockResolvedValueOnce(snapshot);

    const response = await memberStatusHandler(
      new NextRequest("http://localhost/api/socios/member/status"),
      buildContext(memberId)
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.data).toMatchObject(snapshot);
    expect(mockGetMemberFinancialSnapshot).toHaveBeenCalledWith(memberId);
  });

  it("devuelve 422 cuando el memberId no es un UUID", async () => {
    mockMemberIdSchemaParse.mockImplementationOnce(() => {
      throw new ZodError([]);
    });

    const response = await memberStatusHandler(
      new NextRequest("http://localhost/api/socios/invalid/status"),
      buildContext("not-a-uuid")
    );

    expect(response.status).toBe(422);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("ValidationError");
    expect(mockGetMemberFinancialSnapshot).not.toHaveBeenCalled();
  });

  it("propaga AppError del servicio", async () => {
    const memberId = "123e4567-e89b-12d3-a456-426614174111";
    mockGetMemberFinancialSnapshot.mockRejectedValueOnce(new AppError("Socio no encontrado.", 404));

    const response = await memberStatusHandler(
      new NextRequest("http://localhost/api/socios/missing/status"),
      buildContext(memberId)
    );

    expect(response.status).toBe(404);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("Socio no encontrado.");
  });
});
