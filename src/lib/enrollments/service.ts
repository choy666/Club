import { createHash } from "crypto";
import { and, count, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { dues, enrollments, members, payments, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { getEconomicConfigBySlug } from "@/lib/economic-config/service";
import type {
  CreateEnrollmentInput,
  ListDuesInput,
  ListEnrollmentsInput,
  UpdateEnrollmentInput,
} from "@/lib/validations/enrollments";
import {
  enrollmentHasPaidDuesExpression,
  findDueById,
  findEnrollmentById,
  findEnrollmentByMemberId,
  mapDueRow,
  mapEnrollmentRow,
} from "@/lib/enrollments/queries";
import { formatDateOnly } from "@/lib/enrollments/schedule";
import { enforceFrozenDuesPolicy } from "@/lib/enrollments/frozen-policy";
import type {
  DueDTO,
  DueListResponse,
  EnrollmentDTO,
  EnrollmentListResponse,
  EnrollmentStatus,
  MemberCredentialDTO,
} from "@/types/enrollment";
import type { PaymentDTO } from "@/types/payment";
import type { MemberFinancialSnapshot, MemberStatus } from "@/types/member";

const MEMBER_STATUS_BY_ENROLLMENT: Record<EnrollmentStatus, MemberStatus> = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CANCELLED: "INACTIVE",
};

function buildCredentialCode(memberId: string, enrollmentId: string, updatedAt: string) {
  return createHash("sha256")
    .update(`${memberId}:${enrollmentId}:${updatedAt}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

function buildCredentialPayload(params: {
  code: string;
  memberId: string;
  enrollmentId: string;
  issuedAt: string;
}) {
  const payload = JSON.stringify({
    type: "appclub.credential",
    version: 1,
    code: params.code,
    memberId: params.memberId,
    enrollmentId: params.enrollmentId,
    issuedAt: params.issuedAt,
  });
  return Buffer.from(payload).toString("base64url");
}

function assertMemberExists(memberId: string) {
  return db.query.members.findFirst({
    where: eq(members.id, memberId),
    with: {
      user: true,
    },
  });
}

export async function listEnrollments(
  input: ListEnrollmentsInput
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
        ilike(members.documentNumber, normalized)
      )
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        enrollments,
        members,
        users,
        hasPaidDues: enrollmentHasPaidDuesExpression,
      })
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

export async function createEnrollment(input: CreateEnrollmentInput): Promise<EnrollmentDTO> {
  const [member, economicConfig, existingEnrollment] = await Promise.all([
    assertMemberExists(input.memberId),
    getEconomicConfigBySlug("default"),
    db.query.enrollments.findFirst({
      where: eq(enrollments.memberId, input.memberId),
    }),
  ]);

  if (!member) {
    throw new AppError("Socio no encontrado.", 404);
  }

  if (member.status !== "PENDING") {
    throw new AppError("Solo se pueden inscribir socios pendientes.", 409);
  }

  if (existingEnrollment) {
    throw new AppError("El socio ya tiene una inscripción registrada.", 409);
  }

  const monthlyAmount = economicConfig.defaultMonthlyAmount;

  if (!monthlyAmount || monthlyAmount <= 0) {
    throw new AppError("No hay un monto mensual válido configurado para esta inscripción.", 400);
  }

  const startDate = new Date(input.startDate);
  const startDateValue = formatDateOnly(startDate);

  try {
    let createdEnrollmentId: string | null = null;

    // Crear la inscripción
    const [created] = await db
      .insert(enrollments)
      .values({
        memberId: input.memberId,
        startDate: startDateValue,
        planName: input.planName ?? null,
        monthlyAmount,
        notes: input.notes ?? null,
        status: "ACTIVE",
      })
      .returning();

    createdEnrollmentId = created.id;

    // Actualizar el estado del miembro
    await db
      .update(members)
      .set({
        status: MEMBER_STATUS_BY_ENROLLMENT["ACTIVE"],
        updatedAt: sql`now()`,
      })
      .where(eq(members.id, input.memberId));

    if (!createdEnrollmentId) {
      throw new AppError("No se pudo crear la inscripción.", 500);
    }

    const enrollment = await findEnrollmentById(createdEnrollmentId);
    if (!enrollment) {
      throw new AppError("No se pudo crear la inscripción.", 500);
    }

    return enrollment;
  } catch (error) {
    throw error;
  }
}

export async function updateEnrollment(
  enrollmentId: string,
  input: UpdateEnrollmentInput
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

export async function deleteEnrollment(enrollmentId: string): Promise<EnrollmentDTO> {
  const existing = await findEnrollmentById(enrollmentId);
  if (!existing) {
    throw new AppError("Inscripción no encontrada.", 404);
  }

  if (existing.hasPaidDues) {
    throw new AppError("No se puede eliminar una inscripción que tiene cuotas pagadas.", 409);
  }

  // Eliminar cuotas asociadas
  await db.delete(dues).where(eq(dues.enrollmentId, enrollmentId));
  
  // Eliminar la inscripción
  await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));
  
  // Actualizar el estado del miembro
  await db
    .update(members)
    .set({
      status: "PENDING",
      updatedAt: sql`now()`,
    })
    .where(eq(members.id, existing.member.id));

  return existing;
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

type PaymentMetadata = {
  amount?: number;
  method?: string;
  reference?: string | null;
  notes?: string | null;
};

function mapPaymentRow(row: typeof payments.$inferSelect): PaymentDTO {
  return {
    id: row.id,
    memberId: row.memberId,
    dueId: row.dueId,
    amount: row.amount,
    method: row.method,
    reference: row.reference ?? null,
    notes: row.notes ?? null,
    paidAt: row.paidAt?.toISOString() ?? new Date().toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function recordPayment(
  dueId: string,
  paidAt?: string,
  metadata?: PaymentMetadata,
  options?: { syncStatus?: boolean }
): Promise<{ due: DueDTO; payment: PaymentDTO }> {
  const existing = await findDueById(dueId);
  if (!existing) {
    throw new AppError("Cuota no encontrada.", 404);
  }

  if (existing.status === "FROZEN") {
    throw new AppError(
      "No se pueden registrar pagos sobre cuotas congeladas. Reactivá al socio primero.",
      409
    );
  }

  const paidAtDate = paidAt ? new Date(paidAt) : new Date();
  if (Number.isNaN(paidAtDate.getTime())) {
    throw new AppError("La fecha de pago es inválida.", 422);
  }

  const paymentValues = {
    memberId: existing.member.id,
    dueId,
    amount: metadata?.amount ?? existing.amount,
    method: metadata?.method ?? "INTERNAL",
    reference: metadata?.reference ?? null,
    notes: metadata?.notes ?? null,
    paidAt: paidAtDate,
  };

  // Actualizar estado de la cuota si no está pagada
  if (existing.status !== "PAID") {
    await db
      .update(dues)
      .set({
        status: "PAID",
        paidAt: paidAtDate,
        updatedAt: sql`now()`,
      })
      .where(eq(dues.id, dueId));
  }

  // Crear el registro de pago
  const [paymentRow] = await db
    .insert(payments)
    .values({
      ...paymentValues,
    })
    .onConflictDoUpdate({
      target: payments.dueId,
      set: {
        amount: paymentValues.amount,
        method: paymentValues.method,
        reference: paymentValues.reference,
        notes: paymentValues.notes,
        paidAt: paymentValues.paidAt,
        updatedAt: sql`now()`,
      },
    })
    .returning();

    if (!paymentRow) {
    throw new AppError("No se pudo registrar el pago.", 500);
  }

  const dueUpdated: DueDTO = {
    ...existing,
    status: "PAID",
    paidAt: paidAtDate.toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = {
    due: dueUpdated,
    payment: mapPaymentRow(paymentRow),
  };

  if (options?.syncStatus !== false) {
    await refreshMemberFinancialStatus(existing.member.id);
  }

  return result;
}

export async function payDue(dueId: string, paidAt?: string) {
  const { due } = await recordPayment(dueId, paidAt);
  return due;
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

export async function getMemberCredential(memberId: string): Promise<MemberCredentialDTO> {
  const member = await assertMemberExists(memberId);
  if (!member || !member.user) {
    throw new AppError("Socio no encontrado.", 404);
  }

  const enrollment = await findEnrollmentByMemberId(memberId);
  const { nextStatus } = await determineMemberFinancialStatus(memberId);

  const paidResult = await db
    .select({ value: count() })
    .from(dues)
    .where(and(eq(dues.memberId, memberId), eq(dues.status, "PAID")));

  const hasPaidDues = (paidResult[0]?.value ?? 0) > 0;

  const isReady =
    Boolean(enrollment) &&
    enrollment?.status === "ACTIVE" &&
    nextStatus === "ACTIVE" &&
    hasPaidDues;

  let credential: MemberCredentialDTO["credential"] = null;
  if (isReady && enrollment) {
    const issuedAt = new Date().toISOString();
    const code = buildCredentialCode(memberId, enrollment.id, enrollment.updatedAt);
    credential = {
      code,
      issuedAt,
      qrPayload: buildCredentialPayload({
        code,
        memberId,
        enrollmentId: enrollment.id,
        issuedAt,
      }),
    };
  }

  return {
    member: {
      id: member.id,
      name: member.user.name ?? null,
      email: member.user.email,
      documentNumber: member.documentNumber,
      status: member.status,
    },
    enrollment: enrollment
      ? {
          id: enrollment.id,
          planName: enrollment.planName,
          monthlyAmount: enrollment.monthlyAmount,
          status: enrollment.status,
          startDate: enrollment.startDate,
          updatedAt: enrollment.updatedAt,
        }
      : null,
    credential,
    isReady,
  };
}

async function determineMemberFinancialStatus(memberId: string) {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
    columns: {
      id: true,
      status: true,
    },
  });

  if (!member) {
    throw new AppError("Socio no encontrado.", 404);
  }

  const economicConfig = await getEconomicConfigBySlug("default");
  const graceDays = economicConfig.gracePeriodDays ?? 0;

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - graceDays);
  const thresholdValue = formatDateOnly(thresholdDate);

  await db
    .update(dues)
    .set({
      status: "OVERDUE",
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(dues.memberId, memberId),
        eq(dues.status, "PENDING"),
        lte(dues.dueDate, thresholdValue)
      )
    );

  const [overdueResult, pendingResult, frozenResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(dues)
      .where(and(eq(dues.memberId, memberId), eq(dues.status, "OVERDUE"))),
    db
      .select({ value: count() })
      .from(dues)
      .where(and(eq(dues.memberId, memberId), eq(dues.status, "PENDING"))),
    db
      .select({ value: count() })
      .from(dues)
      .where(and(eq(dues.memberId, memberId), eq(dues.status, "FROZEN"))),
  ]);

  let nextStatus: MemberStatus = "ACTIVE";
  if ((frozenResult[0]?.value ?? 0) > 0) {
    nextStatus = "INACTIVE";
  } else if ((overdueResult[0]?.value ?? 0) > 0) {
    nextStatus = "INACTIVE";
  } else if ((pendingResult[0]?.value ?? 0) > 0) {
    nextStatus = "PENDING";
  }

  return { member, nextStatus };
}

export async function refreshMemberFinancialStatus(memberId: string) {
  const { member, nextStatus } = await determineMemberFinancialStatus(memberId);

  if (member.status !== nextStatus) {
    await db
      .update(members)
      .set({
        status: nextStatus,
        updatedAt: sql`now()`,
      })
      .where(eq(members.id, memberId));
  }

  await enforceFrozenDuesPolicy(memberId, nextStatus);

  return nextStatus;
}

export async function getMemberFinancialSnapshot(
  memberId: string
): Promise<MemberFinancialSnapshot> {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
    with: {
      user: true,
    },
  });

  if (!member) {
    throw new AppError("Socio no encontrado.", 404);
  }

  const economicConfig = await getEconomicConfigBySlug("default");
  const graceDays = economicConfig.gracePeriodDays ?? 0;

  const today = new Date();
  const graceLimit = new Date(today);
  graceLimit.setDate(graceLimit.getDate() - graceDays);
  const graceLimitValue = formatDateOnly(graceLimit);

  const [pendingResult, overdueResult, paidResult, frozenResult, nextDueResult] = await Promise.all(
    [
      db
        .select({ value: count() })
        .from(dues)
        .where(and(eq(dues.memberId, memberId), eq(dues.status, "PENDING"))),
      db
        .select({ value: count() })
        .from(dues)
        .where(
          and(
            eq(dues.memberId, memberId),
            eq(dues.status, "PENDING"),
            lte(dues.dueDate, graceLimitValue)
          )
        ),
      db
        .select({ value: count() })
        .from(dues)
        .where(and(eq(dues.memberId, memberId), eq(dues.status, "PAID"))),
      db
        .select({ value: count() })
        .from(dues)
        .where(and(eq(dues.memberId, memberId), eq(dues.status, "FROZEN"))),
      db
        .select({ dueDate: dues.dueDate })
        .from(dues)
        .where(and(eq(dues.memberId, memberId), eq(dues.status, "PENDING")))
        .orderBy(dues.dueDate)
        .limit(1),
    ]
  );

  const { nextStatus: snapshotStatus } = await determineMemberFinancialStatus(memberId);

  return {
    memberId,
    status: snapshotStatus,
    totals: {
      pending: pendingResult[0]?.value ?? 0,
      overdue: overdueResult[0]?.value ?? 0,
      paid: paidResult[0]?.value ?? 0,
      frozen: frozenResult[0]?.value ?? 0,
    },
    nextDueDate: nextDueResult[0]?.dueDate ?? null,
    gracePeriodDays: graceDays,
  };
}
