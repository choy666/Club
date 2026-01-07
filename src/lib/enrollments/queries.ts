import { db } from "@/db/client";
import { dues, enrollments, members, users } from "@/db/schema";
import type { DueDTO, EnrollmentDTO } from "@/types/enrollment";
import { desc, eq, sql } from "drizzle-orm";
import { toLocalDateOnly } from "@/lib/utils/date-utils";

type EnrollmentRow = {
  enrollments: typeof enrollments.$inferSelect;
  members: typeof members.$inferSelect;
  users: typeof users.$inferSelect;
  hasPaidDues?: boolean | null;
};

type DueRow = {
  dues: typeof dues.$inferSelect;
  enrollments: typeof enrollments.$inferSelect;
  members: typeof members.$inferSelect;
  users: typeof users.$inferSelect;
};

function toIsoDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  // Formatear como ISO pero manteniendo la fecha local (sin conversión a UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

export function mapEnrollmentRow(row: EnrollmentRow): EnrollmentDTO {
  const enrollment = row.enrollments;
  const member = row.members;
  const user = row.users;

  return {
    id: enrollment.id,
    memberId: enrollment.memberId,
    startDate: toLocalDateOnly(enrollment.startDate), // Mantener formato YYYY-MM-DD
    planName: enrollment.planName ?? null,
    monthlyAmount: enrollment.monthlyAmount,
    status: enrollment.status,
    notes: enrollment.notes ?? null,
    createdAt: toIsoDate(enrollment.createdAt), // Mantener ISO para timestamps
    updatedAt: toIsoDate(enrollment.updatedAt), // Mantener ISO para timestamps
    hasPaidDues: Boolean(row.hasPaidDues),
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
    dueDate: toLocalDateOnly(due.dueDate), // Mantener formato YYYY-MM-DD
    amount: due.amount,
    status: due.status,
    paidAt: due.paidAt ? toIsoDate(due.paidAt) : null, // Mantener ISO para timestamps
    createdAt: toIsoDate(due.createdAt), // Mantener ISO para timestamps
    updatedAt: toIsoDate(due.updatedAt), // Mantener ISO para timestamps
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

export const enrollmentHasPaidDuesExpression = sql<boolean>`exists(
  select 1
  from ${dues}
  where ${dues.enrollmentId} = ${enrollments.id} and ${dues.status} = 'PAID'
)`;

export async function findEnrollmentById(enrollmentId: string) {
  const result = await db
    .select({
      enrollments,
      members,
      users,
      hasPaidDues: enrollmentHasPaidDuesExpression,
    })
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

export async function findEnrollmentByMemberId(memberId: string) {
  const result = await db
    .select({
      enrollments,
      members,
      users,
      hasPaidDues: enrollmentHasPaidDuesExpression,
    })
    .from(enrollments)
    .innerJoin(members, eq(enrollments.memberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(enrollments.memberId, memberId))
    .orderBy(desc(enrollments.createdAt))
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
