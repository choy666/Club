import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { dues, enrollments, members, monthlyRunLog } from "@/db/schema";
import { buildDueSchedule } from "@/lib/enrollments/schedule";

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString().split("T")[0] ?? null;
}

type ActiveEnrollmentRow = {
  id: string;
  memberId: string;
  startDate: string;
  monthlyAmount: number;
};

export type GenerateMonthlyDuesDeps = {
  fetchActiveEnrollments: () => Promise<ActiveEnrollmentRow[]>;
  findLastDueDate: (enrollmentId: string) => Promise<string | null>;
  dueExists: (enrollmentId: string, dueDate: string) => Promise<boolean>;
  insertDue: (due: typeof dues.$inferInsert) => Promise<void>;
  logRun: (params: { createdDues: number; operator: string; notes: string }) => Promise<void>;
};

const defaultDeps: GenerateMonthlyDuesDeps = {
  async fetchActiveEnrollments() {
    const rows = await db
      .select({
        id: enrollments.id,
        memberId: enrollments.memberId,
        startDate: enrollments.startDate,
        monthlyAmount: enrollments.monthlyAmount,
      })
      .from(enrollments)
      .innerJoin(members, eq(enrollments.memberId, members.id))
      .where(and(eq(enrollments.status, "ACTIVE"), eq(members.status, "ACTIVE")));

    return rows.map((row) => ({
      ...row,
      startDate: normalizeDate(row.startDate) ?? new Date().toISOString().split("T")[0]!,
    }));
  },
  async findLastDueDate(enrollmentId) {
    const [result] = await db
      .select({ dueDate: dues.dueDate })
      .from(dues)
      .where(eq(dues.enrollmentId, enrollmentId))
      .orderBy(desc(dues.dueDate))
      .limit(1);

    return normalizeDate(result?.dueDate);
  },
  async dueExists(enrollmentId, dueDate) {
    const existing = await db
      .select({ id: dues.id })
      .from(dues)
      .where(and(eq(dues.enrollmentId, enrollmentId), eq(dues.dueDate, dueDate)))
      .limit(1);
    return existing.length > 0;
  },
  async insertDue(dueToInsert) {
    await db.insert(dues).values(dueToInsert);
  },
  async logRun({ createdDues, operator, notes }) {
    await db.insert(monthlyRunLog).values({
      createdDues,
      operator,
      notes,
    });
  },
};

export type GenerateMonthlyDuesResult = {
  processedEnrollments: number;
  createdDues: number;
  operator: string;
  notes: string;
};

export async function generateMonthlyDues(
  operator = "manual",
  deps: GenerateMonthlyDuesDeps = defaultDeps
): Promise<GenerateMonthlyDuesResult> {
  const activeEnrollments = await deps.fetchActiveEnrollments();
  let createdDues = 0;

  for (const enrollment of activeEnrollments) {
    const lastDueDate = await deps.findLastDueDate(enrollment.id);
    const schedule = buildDueSchedule({
      enrollmentId: enrollment.id,
      memberId: enrollment.memberId,
      startDate: lastDueDate ?? enrollment.startDate,
      monthsToGenerate: 1,
      monthlyAmount: enrollment.monthlyAmount,
    });

    const [nextDue] = schedule;
    if (!nextDue) continue;

    const exists = await deps.dueExists(enrollment.id, nextDue.dueDate);
    if (exists) continue;

    await deps.insertDue(nextDue);
    createdDues += 1;
  }

  const notes =
    createdDues > 0
      ? `Se generaron ${createdDues} cuotas nuevas.`
      : "No se generaron cuotas nuevas (todo actualizado).";

  await deps.logRun({ createdDues, operator, notes });

  return {
    processedEnrollments: activeEnrollments.length,
    createdDues,
    operator,
    notes,
  };
}
