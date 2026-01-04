import { db } from "@/db/client";
import { members, users } from "@/db/schema";
import type { MemberDTO } from "@/types/member";
import { and, eq, ne } from "drizzle-orm";

type MemberRow = {
  members: typeof members.$inferSelect;
  users: typeof users.$inferSelect;
};

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function mapMemberRow(row: MemberRow): MemberDTO {
  const member = row.members;
  const user = row.users;

  return {
    id: member.id,
    userId: member.userId,
    name: user.name ?? null,
    email: user.email,
    documentNumber: member.documentNumber,
    phone: member.phone ?? null,
    address: member.address ?? null,
    birthDate: toIso(member.birthDate),
    status: member.status,
    notes: member.notes ?? null,
    createdAt: toIso(member.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(member.updatedAt) ?? new Date().toISOString(),
  };
}

export async function findMemberById(memberId: string) {
  const result = await db
    .select()
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.id, memberId))
    .limit(1);

  if (!result.length) {
    return null;
  }

  return mapMemberRow(result[0]);
}

export async function findMemberByUserId(userId: string) {
  const result = await db
    .select()
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.userId, userId))
    .limit(1);

  if (!result.length) {
    return null;
  }

  return mapMemberRow(result[0]);
}

export async function isDocumentNumberTaken(documentNumber: string, excludeMemberId?: string) {
  const where = excludeMemberId
    ? and(eq(members.documentNumber, documentNumber), ne(members.id, excludeMemberId))
    : eq(members.documentNumber, documentNumber);

  const existing = await db.select({ id: members.id }).from(members).where(where).limit(1);

  return existing.length > 0;
}
