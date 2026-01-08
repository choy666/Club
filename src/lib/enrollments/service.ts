import { createHash } from "crypto";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { dues, enrollments, members, payments, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { getEconomicConfigBySlug } from "@/lib/economic-config/service";
import { validateMultiplePayment } from "@/lib/validations/security";
import { logger, logPayment, logVitalicioPromotion, logError } from "@/lib/monitoring/logger";
import { performanceMonitor, withPerformanceMeasurement } from "@/lib/monitoring/performance";
import { withCache, cacheKeys, queryCache } from "@/lib/monitoring/cache";
import type {
  CreateEnrollmentInput,
  ListEnrollmentsInput,
  ListDuesInput,
  PayDuesInput,
  PaySequentialDuesInput,
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
import { formatDateOnly, buildDueSchedule } from "@/lib/enrollments/schedule";
import { toLocalDateOnly } from "@/lib/utils/date-utils";
import { enforceFrozenDuesPolicy } from "@/lib/enrollments/frozen-policy";
import type { MemberSummary } from "@/components/enrollments/due-table";
import {
  DueDTO,
  DueListResponse,
  EnrollmentDTO,
  EnrollmentListResponse,
  EnrollmentStatus,
  MemberCredentialDTO,
  PaymentDTO,
} from "@/types/enrollment";
import type { MemberFinancialSnapshot, MemberStatus } from "@/types/member";

const MEMBER_STATUS_BY_ENROLLMENT: Record<EnrollmentStatus, MemberStatus> = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CANCELLED: "PENDING",
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

  // Logging para depuración
  logger.info(
    `Intentando inscribir socio - ID: ${member.id}, Estado actual: ${member.status}, Estado requerido: PENDING`,
    {
      memberId: member.id,
      memberStatus: member.status,
      memberName: member.user?.name || "Sin nombre",
      memberEmail: member.user?.email || "Sin email",
    },
    member.id,
    "enrollment_validation"
  );

  if (member.status !== "PENDING") {
    throw new AppError(
      `No se puede inscribir al socio. Estado actual: ${member.status}. Estado requerido: PENDING.`,
      409
    );
  }

  if (existingEnrollment) {
    throw new AppError("El socio ya tiene una inscripción registrada.", 409);
  }

  const monthlyAmount = input.enrollmentAmount ?? economicConfig.defaultMonthlyAmount;

  if (!monthlyAmount || monthlyAmount <= 0) {
    throw new AppError("No hay un monto mensual válido configurado para esta inscripción.", 400);
  }

  // Normalizar la fecha usando la nueva utilidad que mantiene la fecha local exacta
  const startDateValue = toLocalDateOnly(input.startDate);

  // Logging detallado de la fecha
  logger.info(
    `Procesando fecha de inscripción - Input: ${input.startDate} -> Normalizada: ${startDateValue}`,
    {
      originalInput: input.startDate,
      normalizedValue: startDateValue,
      inputType: typeof input.startDate,
      timezoneOffset: new Date().getTimezoneOffset(),
      localDate: new Date().toISOString(),
    },
    member.id,
    "date_processing"
  );

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

    // Logging del registro creado en BD
    logger.info(
      `Inscripción creada exitosamente en BD`,
      {
        enrollmentId: created.id,
        memberId: created.memberId,
        startDate: created.startDate,
        planName: created.planName,
        monthlyAmount: created.monthlyAmount,
        status: created.status,
        notes: created.notes,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      created.id,
      "enrollment_created"
    );

    createdEnrollmentId = created.id;

    // Actualizar el estado del miembro
    await db
      .update(members)
      .set({
        status: MEMBER_STATUS_BY_ENROLLMENT["ACTIVE"],
        updatedAt: sql`now()`,
      })
      .where(eq(members.id, input.memberId));

    // Generar cuotas mensuales automáticamente (generar para 360 meses - 30 años)
    const dueSchedule = buildDueSchedule({
      enrollmentId: createdEnrollmentId!,
      memberId: input.memberId,
      startDate: startDateValue,
      monthsToGenerate: 360,
      monthlyAmount,
    });

    if (dueSchedule.length > 0) {
      await db.insert(dues).values(dueSchedule);

      // Logging de primeras cuotas generadas
      logger.info(
        `Cuotas generadas exitosamente`,
        {
          enrollmentId: createdEnrollmentId,
          totalCuotas: dueSchedule.length,
          primeraCuota: dueSchedule[0],
          ultimaCuota: dueSchedule[dueSchedule.length - 1],
          muestraPrimeras5: dueSchedule.slice(0, 5),
        },
        createdEnrollmentId,
        "dues_generated"
      );
    }

    if (!createdEnrollmentId) {
      throw new AppError("No se pudo crear la inscripción.", 500);
    }

    const enrollment = await findEnrollmentById(createdEnrollmentId!);
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

  // Actualizar la inscripción
  await db
    .update(enrollments)
    .set({
      status: input.status,
      notes: input.notes ?? existing.notes,
      updatedAt: sql`now()`,
    })
    .where(eq(enrollments.id, enrollmentId));

  // Si el estado cambió, actualizar el estado del miembro correspondiente
  if (input.status && input.status !== existing.status) {
    const newMemberStatus = MEMBER_STATUS_BY_ENROLLMENT[input.status];

    await db
      .update(members)
      .set({
        status: newMemberStatus,
        updatedAt: sql`now()`,
      })
      .where(eq(members.id, existing.member.id));
  }

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

  // Obtener cuotas para contar las pagadas
  const enrollmentDues = await db.select().from(dues).where(eq(dues.enrollmentId, enrollmentId));

  const paidDuesCount = enrollmentDues.filter((due) => due.status === "PAID").length;
  const hasPaidDues = paidDuesCount > 0;

  try {
    // Eliminar pagos asociados a las cuotas de esta inscripción
    const dueIds = enrollmentDues.map((due) => due.id);
    if (dueIds.length > 0) {
      await db.delete(payments).where(inArray(payments.dueId, dueIds));
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

    // Log informativo sobre la eliminación
    if (hasPaidDues) {
      logger.info(
        `Enrollment deleted with paid dues`,
        {
          enrollmentId,
          memberId: existing.member.id,
          paidDuesCount,
          totalDuesCount: enrollmentDues.length,
        },
        existing.member.id,
        "enrollment_deletion"
      );
    }

    return existing;
  } catch (error) {
    throw new AppError(`Error al eliminar inscripción: ${(error as Error).message}`, 500);
  }
}

export const checkAndPromoteToVitalicio = withCache(
  async (...args: unknown[]) => {
    const [memberId] = args as [string];
    logger.info(
      `Checking vitalicio promotion for member: ${memberId}`,
      {},
      memberId,
      "vitalicio_check"
    );

    const endTimer = performanceMonitor.startTimer("checkAndPromoteToVitalicio");

    try {
      const paidDuesCount = await db
        .select({ count: count() })
        .from(dues)
        .where(and(eq(dues.memberId, memberId), eq(dues.status, "PAID")));

      if (paidDuesCount[0].count >= 360) {
        await db
          .update(members)
          .set({
            status: "VITALICIO",
            updatedAt: sql`now()`,
          })
          .where(eq(members.id, memberId));

        await db
          .update(dues)
          .set({
            status: "FROZEN",
            statusChangedAt: sql`now()`,
          })
          .where(and(eq(dues.memberId, memberId), eq(dues.status, "PENDING")));

        logVitalicioPromotion(memberId, paidDuesCount[0].count, true);
        endTimer();
        return true;
      }

      logVitalicioPromotion(memberId, paidDuesCount[0].count, false);
      endTimer();
      return false;
    } catch (error) {
      logError("checkAndPromoteToVitalicio", error as Error, { memberId });
      endTimer();
      throw error;
    }
  },
  (...args: unknown[]) => {
    const [memberId] = args as [string];
    return cacheKeys.memberStats(memberId);
  },
  10 * 60 * 1000 // 10 minutos
);

export const payMultipleDues = withPerformanceMeasurement(
  "payMultipleDues",
  async (input: PayDuesInput) => {
    logger.info(
      `Processing multiple dues payment for member: ${input.memberId}`,
      {
        dueIdsCount: input.dueIds.length,
      },
      input.memberId,
      "payment"
    );

    try {
      // Validar límites de pago
      validateMultiplePayment(input.dueIds);

      // Validar que las cuotas pertenezcan al socio
      const duesToPay = await db
        .select()
        .from(dues)
        .where(
          and(
            inArray(dues.id, input.dueIds),
            eq(dues.memberId, input.memberId),
            eq(dues.status, "PENDING")
          )
        );

      if (duesToPay.length !== input.dueIds.length) {
        throw new AppError("Algunas cuotas no son válidas o ya están pagadas");
      }

      const totalAmount = duesToPay.reduce((sum, due) => sum + due.amount, 0);

      // Actualizar cada cuota
      for (const due of duesToPay) {
        await db
          .update(dues)
          .set({
            status: "PAID",
            paidAmount: due.amount,
            statusChangedAt: sql`now()`,
            updatedAt: sql`now()`,
          })
          .where(eq(dues.id, due.id));
      }

      // Verificar si alcanza estado vitalicio
      const promotedToVitalicio = await checkAndPromoteToVitalicio(input.memberId);

      logPayment("completed", input.memberId, duesToPay.length, totalAmount, true);

      // Invalidar cache relevante
      queryCache.delete(cacheKeys.memberDues(input.memberId));
      queryCache.delete(cacheKeys.memberStats(input.memberId));

      return {
        paidDues: duesToPay.length,
        promotedToVitalicio,
      };
    } catch (error) {
      logPayment("failed", input.memberId, input.dueIds.length, 0, false);
      logError("payMultipleDues", error as Error, { input });
      throw error;
    }
  }
);

export const paySequentialDues = withPerformanceMeasurement(
  "paySequentialDues",
  async (input: PaySequentialDuesInput) => {
    logger.info(
      `Processing sequential dues payment for member: ${input.memberId}`,
      {
        numberOfDues: input.numberOfDues,
        dueAmount: input.dueAmount,
      },
      input.memberId,
      "sequential_payment"
    );

    try {
      console.log("💳 [SERVICE] Iniciando paySequentialDues");
      console.log("📊 [SERVICE] input:", input);

      // Obtener las cuotas pendientes ordenadas por fecha (ascendente)
      const pendingDues = await db
        .select()
        .from(dues)
        .where(and(eq(dues.memberId, input.memberId), eq(dues.status, "PENDING")))
        .orderBy(asc(dues.dueDate))
        .limit(input.numberOfDues);

      console.log("📥 [SERVICE] Cuotas pendientes encontradas:", pendingDues.length);
      console.log("📊 [SERVICE] pendingDues:", pendingDues);

      if (pendingDues.length === 0) {
        throw new AppError("No hay cuotas pendientes para pagar");
      }

      if (pendingDues.length < input.numberOfDues) {
        logger.warn(
          `Only ${pendingDues.length} pending dues available, requested ${input.numberOfDues}`,
          { memberId: input.memberId }
        );
      }

      // Usar el monto proporcionado en lugar del monto original de las cuotas
      const totalAmount = input.dueAmount * pendingDues.length;

      console.log("💰 [SERVICE] Monto total del pago:", totalAmount);
      console.log("🔄 [SERVICE] Actualizando cuotas a pagadas...");

      // Actualizar cada cuota a pagada con el nuevo monto y crear registro de pago
      for (const due of pendingDues) {
        console.log("🔄 [SERVICE] Actualizando cuota y creando pago:", due.id);

        // Actualizar estado de la cuota
        await db
          .update(dues)
          .set({
            status: "PAID",
            amount: input.dueAmount, // Actualizar el monto de la cuota
            paidAmount: input.dueAmount, // Usar el monto proporcionado
            statusChangedAt: sql`now()`,
            updatedAt: sql`now()`,
          })
          .where(eq(dues.id, due.id));

        // Crear registro de pago
        const paymentValues = {
          memberId: input.memberId,
          dueId: due.id,
          amount: input.dueAmount,
          method: "INTERNAL",
          reference: null,
          notes: `Pago de ${pendingDues.length} cuota(s)`,
          paidAt: new Date(),
        };

        await db.insert(payments).values(paymentValues);
      }

      console.log("✅ [SERVICE] Cuotas y pagos creados correctamente");
      console.log("🔍 [SERVICE] Verificando pagos creados...");

      // Verificar si se crearon pagos para este miembro
      const paymentsAfter = await db
        .select()
        .from(payments)
        .where(eq(payments.memberId, input.memberId))
        .orderBy(desc(payments.createdAt))
        .limit(pendingDues.length);

      console.log("📥 [SERVICE] Pagos creados después del pago:", paymentsAfter.length);
      console.log("📊 [SERVICE] paymentsAfter:", paymentsAfter);

      // Verificar si alcanza estado vitalicio
      const promotedToVitalicio = await checkAndPromoteToVitalicio(input.memberId);

      logPayment("completed", input.memberId, pendingDues.length, totalAmount, true);

      // Invalidar cache relevante
      queryCache.delete(cacheKeys.memberDues(input.memberId));
      queryCache.delete(cacheKeys.memberStats(input.memberId));

      return {
        paidDues: pendingDues.length,
        totalAmount,
        promotedToVitalicio,
        nextDueDate:
          pendingDues.length < input.numberOfDues ? null : await getNextDueDate(input.memberId),
      };
    } catch (error) {
      logPayment("failed", input.memberId, input.numberOfDues, 0, false);
      logError("paySequentialDues", error as Error, { input });
      throw error;
    }
  }
);

async function getNextDueDate(memberId: string): Promise<string | null> {
  const nextDue = await db
    .select({ dueDate: dues.dueDate })
    .from(dues)
    .where(and(eq(dues.memberId, memberId), eq(dues.status, "PENDING")))
    .orderBy(asc(dues.dueDate))
    .limit(1);

  return nextDue[0]?.dueDate ? toLocalDateOnly(nextDue[0].dueDate) : null;
}

export async function listDues(input: ListDuesInput): Promise<DueListResponse> {
  const { page, perPage, enrollmentId, memberId, status, from, to, search } = input;
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

  // Búsqueda por nombre, correo o documento del socio
  if (search) {
    const searchCondition = or(
      ilike(users.name, `%${search}%`),
      ilike(users.email, `%${search}%`),
      ilike(members.documentNumber, `%${search}%`)
    );
    filters.push(searchCondition);
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
};

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
    method: "INTERNAL",
    reference: null,
    notes: null,
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
    payment: {
      id: paymentRow.id,
      memberId: paymentRow.memberId,
      dueId: paymentRow.dueId,
      amount: paymentRow.amount,
      method: paymentRow.method,
      reference: paymentRow.reference ?? null,
      notes: paymentRow.notes ?? null,
      paidAt: paymentRow.paidAt?.toISOString() ?? new Date().toISOString(),
      createdAt: paymentRow.createdAt.toISOString(),
      updatedAt: paymentRow.updatedAt.toISOString(),
      member: {
        id: existing.member.id,
        name: existing.member.name,
        email: existing.member.email,
        documentNumber: existing.member.documentNumber,
      },
      due: {
        id: existing.id,
        dueDate: existing.dueDate,
        amount: existing.amount,
        status: existing.status,
      },
    },
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

  const isReady =
    Boolean(enrollment) &&
    enrollment?.status === "ACTIVE" &&
    (nextStatus === "ACTIVE" || nextStatus === "PENDING");

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

export async function getMemberSummaries(): Promise<MemberSummary[]> {
  console.log("🔍 [SERVICE] Obteniendo resúmenes completos de socios...");

  const allDues = await db
    .select({
      dues: {
        id: dues.id,
        memberId: dues.memberId,
        enrollmentId: dues.enrollmentId,
        dueDate: dues.dueDate,
        amount: dues.amount,
        status: dues.status,
        paidAt: dues.paidAt,
        paidAmount: dues.paidAmount,
        createdAt: dues.createdAt,
        updatedAt: dues.updatedAt,
      },
      members: {
        id: members.id,
        documentNumber: members.documentNumber,
        status: members.status,
      },
      users: {
        name: users.name,
        email: users.email,
      },
      enrollments: {
        id: enrollments.id,
        planName: enrollments.planName,
        monthlyAmount: enrollments.monthlyAmount,
        startDate: enrollments.startDate,
      },
    })
    .from(dues)
    .innerJoin(members, eq(dues.memberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
    .orderBy(dues.dueDate);

  console.log(`📊 [SERVICE] Procesando ${allDues.length} cuotas para resumen...`);

  const summariesMap = new Map<string, MemberSummary>();

  for (const row of allDues) {
    const memberId = row.members.id;

    if (!summariesMap.has(memberId)) {
      summariesMap.set(memberId, {
        member: {
          id: row.members.id,
          name: row.users.name,
          email: row.users.email,
          documentNumber: row.members.documentNumber,
        },
        enrollment: {
          id: row.enrollments.id,
          planName: row.enrollments.planName,
          monthlyAmount: row.enrollments.monthlyAmount,
          startDate: toLocalDateOnly(row.enrollments.startDate),
        },
        dues: [],
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        frozenCount: 0,
        amountDue: 0,
        amountPaid: 0,
      });
    }

    const summary = summariesMap.get(memberId)!;
    summary.dues.push({
      id: row.dues.id,
      memberId: row.dues.memberId,
      enrollmentId: row.dues.enrollmentId,
      dueDate: toLocalDateOnly(row.dues.dueDate),
      amount: row.dues.amount,
      status: row.dues.status,
      paidAt: row.dues.paidAt ? row.dues.paidAt.toISOString() : null,
      paidAmount: row.dues.paidAmount,
      createdAt: row.dues.createdAt.toISOString(),
      updatedAt: row.dues.updatedAt.toISOString(),
      member: {
        id: row.members.id,
        name: row.users.name,
        email: row.users.email,
        documentNumber: row.members.documentNumber,
      },
      enrollment: {
        id: row.enrollments.id,
        planName: row.enrollments.planName,
        monthlyAmount: row.enrollments.monthlyAmount,
        startDate: toLocalDateOnly(row.enrollments.startDate),
      },
    });

    // Actualizar contadores según estado
    switch (row.dues.status) {
      case "PAID":
        summary.paidCount++;
        // Sumar el monto realmente pagado (paidAmount si existe y no es null, sino el amount original)
        summary.amountPaid += row.dues.paidAmount ?? row.dues.amount;
        break;
      case "PENDING":
        summary.pendingCount++;
        summary.amountDue += row.dues.amount;
        break;
      case "OVERDUE":
        summary.overdueCount++;
        summary.amountDue += row.dues.amount;
        break;
      case "FROZEN":
        summary.frozenCount++;
        break;
    }
  }

  const summaries = Array.from(summariesMap.values()).sort((a, b) => {
    const nameA = a.member.name ?? "";
    const nameB = b.member.name ?? "";
    return nameA.localeCompare(nameB, "es");
  });

  console.log(`✅ [SERVICE] Resúmenes generados: ${summaries.length} socios`);
  return summaries;
}

export async function getMemberPaymentsGrouped(memberId: string): Promise<
  Array<{
    date: string;
    totalAmount: number;
    duesCount: number;
    method: string;
    reference: string | null;
    notes: string | null;
  }>
> {
  console.log("🔍 [SERVICE] getMemberPaymentsGrouped llamado con memberId:", memberId);

  const allPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      paidAt: payments.paidAt,
      dueId: payments.dueId,
      dueAmount: dues.amount,
      dueDate: dues.dueDate,
      dueStatus: dues.status,
    })
    .from(payments)
    .innerJoin(dues, eq(payments.dueId, dues.id))
    .where(eq(payments.memberId, memberId))
    .orderBy(desc(payments.paidAt));

  console.log("📥 [SERVICE] Pagos encontrados en DB:", allPayments.length);
  console.log("📊 [SERVICE] Primer pago:", allPayments[0]);

  // Agrupar pagos por fecha (mismo día = mismo pago)
  const groupedPayments = new Map<
    string,
    {
      totalAmount: number;
      duesCount: number;
      method: string;
      reference: string | null;
      notes: string | null;
      paidAt: Date;
    }
  >();

  for (const payment of allPayments) {
    const dateKey = payment.paidAt.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!groupedPayments.has(dateKey)) {
      groupedPayments.set(dateKey, {
        totalAmount: 0,
        duesCount: 0,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
        paidAt: payment.paidAt,
      });
    }

    const group = groupedPayments.get(dateKey)!;
    group.totalAmount += payment.amount;
    group.duesCount += 1;
  }

  // Convertir a array y ordenar por fecha descendente
  const result = Array.from(groupedPayments.entries())
    .map(([date, data]) => ({
      date,
      totalAmount: data.totalAmount,
      duesCount: data.duesCount,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log("✅ [SERVICE] Pagos agrupados finales:", result);
  console.log("📊 [SERVICE] Cantidad de grupos:", result.length);

  return result;
}

// Nueva función para obtener pagos individuales sin agrupar
export async function getMemberPaymentsIndividual(memberId: string): Promise<
  Array<{
    id: string;
    amount: number;
    method: string;
    reference: string | null;
    notes: string | null;
    paidAt: string;
    dueId: string;
    dueAmount: number;
    dueDate: string;
    dueStatus: string;
  }>
> {
  console.log("🔍 [SERVICE] getMemberPaymentsIndividual llamado con memberId:", memberId);

  const allPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      paidAt: payments.paidAt,
      dueId: payments.dueId,
      dueAmount: dues.amount,
      dueDate: dues.dueDate,
      dueStatus: dues.status,
    })
    .from(payments)
    .innerJoin(dues, eq(payments.dueId, dues.id))
    .where(eq(payments.memberId, memberId))
    .orderBy(desc(payments.paidAt));

  console.log("📥 [SERVICE] Pagos individuales encontrados en DB:", allPayments.length);

  // Convertir a formato esperado por el frontend
  const result = allPayments.map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
    paidAt: payment.paidAt.toISOString(),
    dueId: payment.dueId,
    dueAmount: payment.dueAmount,
    dueDate: payment.dueDate,
    dueStatus: payment.dueStatus,
  }));

  console.log("✅ [SERVICE] Pagos individuales formateados:", result.length);

  return result;
}

// Nueva función para agrupar pagos por transacción real
export async function getMemberPaymentsByTransaction(memberId: string): Promise<
  Array<{
    transactionId: string;
    paidAt: string;
    totalAmount: number;
    duesCount: number;
    method: string;
    reference: string | null;
    notes: string | null;
    dues: Array<{
      dueId: string;
      dueAmount: number;
      dueDate: string;
      dueStatus: string;
    }>;
  }>
> {
  console.log("🔍 [SERVICE] getMemberPaymentsByTransaction llamado con memberId:", memberId);

  const allPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      paidAt: payments.paidAt,
      dueId: payments.dueId,
      dueAmount: dues.amount,
      dueDate: dues.dueDate,
      dueStatus: dues.status,
    })
    .from(payments)
    .innerJoin(dues, eq(payments.dueId, dues.id))
    .where(eq(payments.memberId, memberId))
    .orderBy(desc(payments.paidAt));

  console.log("📥 [SERVICE] Pagos encontrados en DB:", allPayments.length);

  // Agrupar por transacción (pagos con misma fecha/hora y método)
  const transactionGroups = new Map<
    string,
    {
      paidAt: Date;
      method: string;
      reference: string | null;
      notes: string | null;
      totalAmount: number;
      dues: Array<{
        dueId: string;
        dueAmount: number;
        dueDate: string;
        dueStatus: string;
      }>;
    }
  >();

  for (const payment of allPayments) {
    // Crear clave de transacción: fecha + hora (minutos) + método
    const paymentTime = new Date(payment.paidAt);
    const transactionKey = `${paymentTime.getFullYear()}-${paymentTime.getMonth()}-${paymentTime.getDate()}-${paymentTime.getHours()}-${Math.floor(paymentTime.getMinutes() / 5)}-${payment.method}`;

    if (!transactionGroups.has(transactionKey)) {
      transactionGroups.set(transactionKey, {
        paidAt: paymentTime,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
        totalAmount: 0,
        dues: [],
      });
    }

    const group = transactionGroups.get(transactionKey)!;
    group.totalAmount += payment.amount;
    group.dues.push({
      dueId: payment.dueId,
      dueAmount: payment.dueAmount,
      dueDate: payment.dueDate,
      dueStatus: payment.dueStatus,
    });
  }

  // Convertir a array y ordenar por fecha descendente
  const result = Array.from(transactionGroups.entries())
    .map(([key, data]) => ({
      transactionId: key,
      paidAt: data.paidAt.toISOString(),
      totalAmount: data.totalAmount,
      duesCount: data.dues.length,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      dues: data.dues.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    }))
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  console.log("✅ [SERVICE] Transacciones agrupadas:", result.length);
  console.log(
    "📊 [SERVICE] Detalle:",
    result.map((t) => ({
      fecha: new Date(t.paidAt).toLocaleString(),
      cuotas: t.duesCount,
      monto: t.totalAmount,
    }))
  );

  return result;
}
