import { describe, expect, it } from "vitest";

import { addMonths, buildDueSchedule, formatDateOnly } from "./schedule";

describe("enrollments schedule helpers", () => {
  it("formats date only in ISO format", () => {
    const date = new Date("2025-01-15T12:00:00.000Z");
    expect(formatDateOnly(date)).toBe("2025-01-15");
  });

  it("formats date using local timezone", () => {
    // Test with a specific date to ensure local timezone is used
    const date = new Date(2025, 0, 15, 12, 0, 0); // January 15, 2025 12:00:00 local time
    expect(formatDateOnly(date)).toBe("2025-01-15");
  });

  it("adds months keeping day when possible", () => {
    const base = new Date("2025-01-15T03:00:00.000Z");
    const result = addMonths(base, 1);
    expect(formatDateOnly(result)).toBe("2025-02-15"); // Siguiente mes manteniendo el día
  });

  it("creates 360 dues schedule for full membership", () => {
    const dues = buildDueSchedule({
      enrollmentId: "enroll-1",
      memberId: "member-1",
      startDate: "2025-02-01",
      monthsToGenerate: 360,
      monthlyAmount: 5000,
    });

    expect(dues).toHaveLength(360);
    expect(dues[0]).toMatchObject({
      enrollmentId: "enroll-1",
      memberId: "member-1",
      dueDate: "2025-03-01", // Siguiente mes de la inscripción
      amount: 5000,
    });
    // Verificar última cuota (30 años después)
    expect(dues[359]?.dueDate).toBe("2055-02-01");
  });

  it("creates due schedule starting next month with expected values", () => {
    const dues = buildDueSchedule({
      enrollmentId: "enroll-1",
      memberId: "member-1",
      startDate: "2025-02-01",
      monthsToGenerate: 3,
      monthlyAmount: 5000,
    });

    expect(dues).toHaveLength(3);
    expect(dues[0]).toMatchObject({
      enrollmentId: "enroll-1",
      memberId: "member-1",
      dueDate: "2025-03-01", // Siguiente mes de la inscripción
      amount: 5000,
    });
    expect(dues[2]?.dueDate).toBe("2025-05-01");
  });

  it("handles Date objects as startDate", () => {
    const dues = buildDueSchedule({
      enrollmentId: "enroll-2",
      memberId: "member-2",
      startDate: new Date("2025-03-10T05:00:00.000Z"),
      monthsToGenerate: 1,
      monthlyAmount: 7000,
    });

    expect(dues[0]?.dueDate).toBe("2025-04-10"); // Siguiente mes manteniendo el día
  });

  it("throws when start date is invalid", () => {
    expect(() =>
      buildDueSchedule({
        enrollmentId: "enroll-3",
        memberId: "member-3",
        startDate: "not-a-date",
        monthsToGenerate: 2,
        monthlyAmount: 1000,
      })
    ).toThrow("Fecha inválida");
  });
});
