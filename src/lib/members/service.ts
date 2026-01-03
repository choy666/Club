import { count, eq, ilike, and, or } from "drizzle-orm";

import { db } from "@/db/client";
import { members, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import type {
  CreateMemberInput,
  ListMembersInput,
  UpdateMemberInput,
} from "@/lib/validations/members";
import { AppError } from "@/lib/errors";
import type { MemberDTO, MembersListResponse } from "@/types/member";
import {
  findMemberById,
  findMemberByUserId,
  isDocumentNumberTaken,
  mapMemberRow,
} from "./queries";
import { enforceFrozenDuesPolicy } from "@/lib/enrollments/frozen-policy";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type MemberInsertValues = typeof members.$inferInsert;

function buildMemberInsert(
  userId: string,
  values: CreateMemberInput,
): MemberInsertValues {
  return {
    userId,
    documentNumber: values.documentNumber,
    phone: values.phone ?? null,
    address: values.address ?? null,
    birthDate: values.birthDate ?? null,
    status: values.status ?? "PENDING",
    notes: values.notes ?? null,
  };
}

function buildMemberUpdate(
  values: UpdateMemberInput,
): Partial<MemberInsertValues> {
  const normalized: Partial<MemberInsertValues> = {};

  if (values.documentNumber !== undefined) {
    normalized.documentNumber = values.documentNumber;
  }

  if (values.phone !== undefined) {
    normalized.phone = values.phone ?? null;
  }

  if (values.address !== undefined) {
    normalized.address = values.address ?? null;
  }

  if (values.birthDate !== undefined) {
    normalized.birthDate = values.birthDate ?? null;
  }

  if (values.status !== undefined) {
    normalized.status = values.status;
  }

  if (values.notes !== undefined) {
    normalized.notes = values.notes ?? null;
  }

  return normalized;
}

async function ensureEmailUnique(email: string, excludeUserId?: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing && existing.id !== excludeUserId) {
    throw new AppError("El correo ya está registrado.", 409);
  }
}

export async function listMembers(
  params: ListMembersInput,
): Promise<MembersListResponse> {
  const { page, perPage, status, search } = params;
  const offset = (page - 1) * perPage;

  const filters = [];

  if (status) {
    filters.push(eq(members.status, status));
  }

  if (search) {
    const pattern = `%${search}%`;
    filters.push(
      or(
        ilike(users.name, pattern),
        ilike(users.email, pattern),
        ilike(members.documentNumber, pattern),
      ),
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(where)
      .orderBy(members.createdAt)
      .limit(perPage)
      .offset(offset),
    db
      .select({ value: count() })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    data: rows.map(mapMemberRow),
    meta: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
}

export async function createMember(
  input: CreateMemberInput,
): Promise<MemberDTO> {
  const email = normalizeEmail(input.email);

  await ensureEmailUnique(email);

  const documentTaken = await isDocumentNumberTaken(input.documentNumber);
  if (documentTaken) {
    throw new AppError("El número de documento ya está registrado.", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const [createdUser] = await db
    .insert(users)
    .values({
      name: input.name,
      email,
      role: "USER",
      passwordHash,
    })
    .returning();

  const [createdMember] = await db
    .insert(members)
    .values(buildMemberInsert(createdUser.id, input))
    .returning();

  const result = await findMemberById(createdMember.id);
  if (!result) {
    throw new AppError("No se pudo crear el socio.", 500);
  }

  return result;
}

export async function updateMember(
  memberId: string,
  input: UpdateMemberInput,
): Promise<MemberDTO> {
  const existing = await db.query.members.findFirst({
    where: eq(members.id, memberId),
    with: { user: true },
  });

  if (!existing) {
    throw new AppError("Socio no encontrado.", 404);
  }

  const email =
    input.email !== undefined
      ? normalizeEmail(input.email)
      : existing.user.email;

  await ensureEmailUnique(email, existing.userId);

  if (
    input.documentNumber &&
    input.documentNumber !== existing.documentNumber
  ) {
    const taken = await isDocumentNumberTaken(input.documentNumber, memberId);
    if (taken) {
      throw new AppError("El número de documento ya está registrado.", 409);
    }
  }

  const userUpdate: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
    email,
  };

  if (input.name !== undefined) {
    userUpdate.name = input.name;
  }

  if (input.password ?? undefined) {
    userUpdate.passwordHash = await hashPassword(input.password as string);
  }

  await db.update(users).set(userUpdate).where(eq(users.id, existing.userId));

  const normalized = buildMemberUpdate(input);
  await db
    .update(members)
    .set({
      ...normalized,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId));

  const result = await findMemberById(memberId);
  if (!result) {
    throw new AppError("No se pudo actualizar el socio.", 500);
  }

  if (input.status && input.status !== existing.status) {
    await enforceFrozenDuesPolicy(memberId, result.status);
  }

  return result;
}

export async function deleteMember(memberId: string) {
  const existing = await db.query.members.findFirst({
    where: eq(members.id, memberId),
  });

  if (!existing) {
    throw new AppError("Socio no encontrado.", 404);
  }

  await db.delete(members).where(eq(members.id, memberId));
  await db.delete(users).where(eq(users.id, existing.userId));

  return { success: true };
}

export async function getMemberById(memberId: string) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw new AppError("Socio no encontrado.", 404);
  }

  return member;
}

export async function getMemberForUser(userId: string) {
  const member = await findMemberByUserId(userId);
  if (!member) {
    throw new AppError("El usuario no tiene datos de socio.", 404);
  }

  return member;
}
