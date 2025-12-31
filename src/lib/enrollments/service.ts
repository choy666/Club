import { and, count, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { dues, enrollments, members, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type {
  CreateEnrollmentInput,
  ListDuesInput,
  ListEnrollmentsInput,
  UpdateEnrollmentInput,
} from "@/lib/validations/enrollments";
import {
  findDueById,
  findEnrollmentById,
  mapDueRow,
  mapEnrollmentRow,
} from "@/lib/enrollments/queries";
import type {
  DueDTO,
  DueListResponse,
  EnrollmentDTO,
  EnrollmentListResponse,
} from "@/types/enrollment";

function assertMemberExists(memberId: string) {
  return db.query.members.findFirst({
    where: eq(members.id, memberId),
    with: {
      user: true,
    },
  });
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDateOnly(date: Date) {
  return date.toISOString().split("T")[0]!;
}

export async function listEnrollments(
  input: ListEnrollmentsInput,
): Promise<EnrollmentListResponse> {
  const { page, perPage, memberId, status, search } = input;
  const offset = (page - 1) * perPage;

  const filters = [];

  if (memberId) {
    filters.push(eq(enrollments.memberId, memberId));
  }

  if (status) {
    filters.push(eq(enrollments.status, status));
  }

  if (search) {
    const normalized = `%${search}%`;
    filters.push(
      or(
        ilike(users.name, normalized),
        ilike(users.email, normalized),
        ilike(members.documentNumber, normalized),
      ),
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(enrollments)
      .innerJoin(members, eq(enrollments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(where)
      .orderBy(enrollments.createdAt)
      .limit(perPage)
      .offset(offset),
    db
      .select({ value: count() })
      .from(enrollments)
      .innerJoin(members, eq(enrollments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    data: rows.map(mapEnrollmentRow),
    meta: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
}

export async function createEnrollment(
  input: CreateEnrollmentInput,
): Promise<EnrollmentDTO> {
  const member = await assertMemberExists(input.memberId);

  if (!member) {
    throw new AppError("Socio no encontrado.", 404);
  }

  const startDate = new Date(input.startDate);
  const startDateValue = formatDateOnly(startDate);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(enrollments)
      .values({
        memberId: input.memberId,
        startDate: startDateValue,
        planName: input.planName ?? null,
        monthlyAmount: input.monthlyAmount,
        monthsToGenerate: input.monthsToGenerate,
        notes: input.notes ?? null,
      })
      .returning();

    const duesToInsert = Array.from(
      { length: input.monthsToGenerate },
      (_, index) => {
        const dueDate = addMonths(startDate, index);
        return {
          enrollmentId: created.id,
          memberId: input.memberId,
          dueDate: formatDateOnly(dueDate),
          amount: input.monthlyAmount,
        };
      },
    );

    if (duesToInsert.length) {
      await tx.insert(dues).values(duesToInsert);
    }

    const enrollment = await findEnrollmentById(created.id);
    if (!enrollment) {
      throw new AppError("No se pudo crear la inscripción.", 500);
    }

    return enrollment;
  });
}

export async function updateEnrollment(
  enrollmentId: string,
  input: UpdateEnrollmentInput,
): Promise<EnrollmentDTO> {
  const existing = await findEnrollmentById(enrollmentId);
  if (!existing) {
    throw new AppError("Inscripción no encontrada.", 404);
  }

  await db
    .update(enrollments)
    .set({
      status: input.status,
      notes: input.notes ?? existing.notes,
      updatedAt: sql`now()`,
    })
    .where(eq(enrollments.id, enrollmentId));

  const updated = await findEnrollmentById(enrollmentId);
  if (!updated) {
    throw new AppError("No se pudo actualizar la inscripción.", 500);
  }

  return updated;
}

export async function listDues(input: ListDuesInput): Promise<DueListResponse> {
  const { page, perPage, enrollmentId, memberId, status, from, to } = input;
  const offset = (page - 1) * perPage;

  const filters = [];

  if (enrollmentId) {
    filters.push(eq(dues.enrollmentId, enrollmentId));
  }

  if (memberId) {
    filters.push(eq(dues.memberId, memberId));
  }

  if (status) {
    filters.push(eq(dues.status, status));
  }

  if (from) {
    filters.push(gte(dues.dueDate, formatDateOnly(new Date(from))));
  }

  if (to) {
    filters.push(lte(dues.dueDate, formatDateOnly(new Date(to))));
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(dues)
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .innerJoin(members, eq(dues.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(where)
      .orderBy(dues.dueDate)
      .limit(perPage)
      .offset(offset),
    db
      .select({ value: count() })
      .from(dues)
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .innerJoin(members, eq(dues.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    data: rows.map(mapDueRow),
    meta: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
}

export async function payDue(dueId: string, paidAt?: string): Promise<DueDTO> {
  const existing = await findDueById(dueId);
  if (!existing) {
    throw new AppError("Cuota no encontrada.", 404);
  }

  if (existing.status === "PAID") {
    return existing;
  }

  await db
    .update(dues)
    .set({
      status: "PAID",
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      updatedAt: sql`now()`,
    })
    .where(eq(dues.id, dueId));

  const updated = await findDueById(dueId);
  if (!updated) {
    throw new AppError("No se pudo actualizar la cuota.", 500);
  }

  return updated;
}

export async function getDueDetail(dueId: string) {
  const due = await findDueById(dueId);
  if (!due) {
    throw new AppError("Cuota no encontrada.", 404);
  }

  return due;
}

export async function getEnrollmentDetail(enrollmentId: string) {
  const enrollment = await findEnrollmentById(enrollmentId);
  if (!enrollment) {
    throw new AppError("Inscripción no encontrada.", 404);
  }

  return enrollment;
}
