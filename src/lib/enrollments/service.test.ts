import { describe, expect, it, vi, beforeEach } from "vitest";

import { AppError } from "@/lib/errors";

const mockMemberFindFirst = vi.fn();
const mockEnrollmentFindFirst = vi.fn();
const mockFindDueById = vi.fn();
const mockFindEnrollmentById = vi.fn();

const mockEconomicConfig = vi.hoisted(() => ({
  defaultMonthlyAmount: 1000,
  defaultMonthsToGenerate: 1,
}));

vi.mock("@/db/client", () => {
  return {
    db: {
      query: {
        members: {
          findFirst: (...args: unknown[]) => mockMemberFindFirst(...args),
        },
        enrollments: {
          findFirst: (...args: unknown[]) => mockEnrollmentFindFirst(...args),
        },
      },
      transaction: vi.fn(),
    },
  };
});

vi.mock("@/lib/enrollments/queries", () => ({
  findDueById: (...args: unknown[]) => mockFindDueById(...args),
  findEnrollmentById: (...args: unknown[]) => mockFindEnrollmentById(...args),
  mapDueRow: vi.fn(),
  mapEnrollmentRow: vi.fn(),
}));

vi.mock("@/lib/economic-config/service", () => ({
  getEconomicConfigBySlug: vi.fn().mockResolvedValue(mockEconomicConfig),
}));

import { createEnrollment, recordPayment } from "./service";

describe("createEnrollment", () => {
  beforeEach(() => {
    mockMemberFindFirst.mockReset();
    mockEnrollmentFindFirst.mockReset();
  });

  it("lanza AppError 409 cuando el socio ya tiene una inscripción", async () => {
    mockMemberFindFirst.mockResolvedValue({
      id: "member-1",
      status: "ACTIVE",
      user: { id: "user-1", email: "member@test.com" },
    });
    mockEnrollmentFindFirst.mockResolvedValue({
      id: "enrollment-1",
      memberId: "member-1",
    });

    const promise = createEnrollment({
      memberId: "member-1",
      startDate: "2025-01-01",
      monthlyAmount: 15000,
      monthsToGenerate: 3,
    });

    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({
      message: "El socio ya tiene una inscripción registrada.",
      status: 409,
    });
    expect(mockEnrollmentFindFirst).toHaveBeenCalledTimes(1);
  });
});

describe("recordPayment", () => {
  beforeEach(() => {
    mockFindDueById.mockReset();
  });

  it("rechaza pagos cuando la cuota está congelada", async () => {
    mockFindDueById.mockResolvedValue({
      id: "due-1",
      status: "FROZEN",
      amount: 1000,
      member: { id: "member-1" },
    });

    const promise = recordPayment("due-1");

    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({
      message: "No se pueden registrar pagos sobre cuotas congeladas. Reactivá al socio primero.",
      status: 409,
    });
    expect(mockFindDueById).toHaveBeenCalledWith("due-1");
  });
});
