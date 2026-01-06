import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { db } from "@/db/client";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const memberId = searchParams.memberId;

    if (!memberId) {
      return handleApiError(new Error("Se requiere el parámetro memberId"));
    }

    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      with: {
        user: true,
      },
    });

    if (!member) {
      return handleApiError(new Error("Socio no encontrado"));
    }

    return jsonSuccess({
      id: member.id,
      name: member.user?.name || "Sin nombre",
      email: member.user?.email || "Sin email",
      documentNumber: member.documentNumber,
      status: member.status,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
