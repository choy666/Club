import { describe, expect, it, vi } from "vitest";

import type { GenerateMonthlyDuesDeps } from "@/lib/jobs/monthly-dues";
import { generateMonthlyDues } from "@/lib/jobs/monthly-dues";

describe("generateMonthlyDues", () => {
  const baseEnrollment = {
    id: "enroll-1",
    memberId: "member-1",
    startDate: "2025-01-10",
    monthlyAmount: 15000,
  };

  const createDeps = (overrides: Partial<GenerateMonthlyDuesDeps> = {}) => {
    const defaultDeps: GenerateMonthlyDuesDeps = {
      fetchActiveEnrollments: vi.fn().mockResolvedValue([baseEnrollment]),
      findLastDueDate: vi.fn().mockResolvedValue(null),
      dueExists: vi.fn().mockResolvedValue(false),
      insertDue: vi.fn().mockResolvedValue(undefined),
      logRun: vi.fn().mockResolvedValue(undefined),
    };

    return { ...defaultDeps, ...overrides } satisfies GenerateMonthlyDuesDeps;
  };

  it("crea una cuota para cada inscripción activa y registra el log", async () => {
    const deps = createDeps();

    const result = await generateMonthlyDues("cron", deps);

    expect(result.createdDues).toBe(1);
    expect(result.processedEnrollments).toBe(1);
    expect(result.operator).toBe("cron");
    expect(deps.insertDue).toHaveBeenCalledTimes(1);
    expect(deps.dueExists).toHaveBeenCalledWith(baseEnrollment.id, expect.any(String));
    expect(deps.logRun).toHaveBeenCalledWith(
      expect.objectContaining({ createdDues: 1, operator: "cron" })
    );
  });

  it("omite la inserción cuando la cuota ya existe", async () => {
    const deps = createDeps({ dueExists: vi.fn().mockResolvedValue(true) });

    const result = await generateMonthlyDues("manual", deps);

    expect(result.createdDues).toBe(0);
    expect(deps.insertDue).not.toHaveBeenCalled();
    expect(deps.logRun).toHaveBeenCalledWith(expect.objectContaining({ createdDues: 0 }));
  });

  it("cuando no hay inscripciones activas sólo registra la ejecución", async () => {
    const deps = createDeps({
      fetchActiveEnrollments: vi.fn().mockResolvedValue([]),
    });

    const result = await generateMonthlyDues("cron", deps);

    expect(result.processedEnrollments).toBe(0);
    expect(result.createdDues).toBe(0);
    expect(deps.insertDue).not.toHaveBeenCalled();
    expect(deps.logRun).toHaveBeenCalledWith(expect.objectContaining({ createdDues: 0 }));
  });
});
