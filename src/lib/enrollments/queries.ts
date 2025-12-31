import { db } from "@/db/client";
import { dues, enrollments, members, users } from "@/db/schema";
import type { DueDTO, EnrollmentDTO } from "@/types/enrollment";
import { eq } from "drizzle-orm";

type EnrollmentRow = {
  enrollments: typeof enrollments.$inferSelect;
  members: typeof members.$inferSelect;
  users: typeof users.$inferSelect;
};

type DueRow = {
  dues: typeof dues.$inferSelect;
  enrollments: typeof enrollments.$inferSelect;
  members: typeof members.$inferSelect;
  users: typeof users.$inferSelect;
};

function toIsoDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

export function mapEnrollmentRow(row: EnrollmentRow): EnrollmentDTO {
  const enrollment = row.enrollments;
  const member = row.members;
  const user = row.users;

  return {
    id: enrollment.id,
    memberId: enrollment.memberId,
    startDate: toIsoDate(enrollment.startDate),
    planName: enrollment.planName ?? null,
    monthlyAmount: enrollment.monthlyAmount,
    monthsToGenerate: enrollment.monthsToGenerate,
    status: enrollment.status,
    notes: enrollment.notes ?? null,
    createdAt: toIsoDate(enrollment.createdAt),
    updatedAt: toIsoDate(enrollment.updatedAt),
    member: {
      id: member.id,
      name: user.name ?? null,
      email: user.email,
      documentNumber: member.documentNumber,
      status: member.status,
    },
  };
}

export function mapDueRow(row: DueRow): DueDTO {
  const due = row.dues;
  const enrollment = row.enrollments;
  const member = row.members;
  const user = row.users;

  return {
    id: due.id,
    enrollmentId: due.enrollmentId,
    memberId: due.memberId,
    dueDate: toIsoDate(due.dueDate),
    amount: due.amount,
    status: due.status,
    paidAt: due.paidAt ? toIsoDate(due.paidAt) : null,
    createdAt: toIsoDate(due.createdAt),
    updatedAt: toIsoDate(due.updatedAt),
    member: {
      id: member.id,
      name: user.name ?? null,
      email: user.email,
      documentNumber: member.documentNumber,
    },
    enrollment: {
      id: enrollment.id,
      planName: enrollment.planName ?? null,
      monthlyAmount: enrollment.monthlyAmount,
    },
  };
}

export async function findEnrollmentById(enrollmentId: string) {
  const result = await db
    .select()
    .from(enrollments)
    .innerJoin(members, eq(enrollments.memberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!result.length) {
    return null;
  }

  return mapEnrollmentRow(result[0]);
}

export async function findDueById(dueId: string) {
  const result = await db
    .select()
    .from(dues)
    .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
    .innerJoin(members, eq(dues.memberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(dues.id, dueId))
    .limit(1);

  if (!result.length) {
    return null;
  }

  return mapDueRow(result[0]);
}
