import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { db } from "@/db/client";
import { dues } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requireAdminSession();
    const { memberId } = await params;

    // Obtener estadísticas de cuotas del socio
    const [paidCount, totalCount] = await Promise.all([
      db
        .select({ count: count() })
        .from(dues)
        .where(and(eq(dues.memberId, memberId), eq(dues.status, "PAID"))),
      db.select({ count: count() }).from(dues).where(eq(dues.memberId, memberId)),
    ]);

    const paid = paidCount[0]?.count || 0;
    const total = totalCount[0]?.count || 0;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

    return jsonSuccess({
      paidCount: paid,
      totalCount: total,
      percentage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
