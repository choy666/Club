import { sql, count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { dues, enrollments, members } from "@/db/schema";
import type { DashboardSummary } from "@/types/dashboard";
import { formatDateOnly } from "@/lib/enrollments/schedule";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = formatDateOnly(new Date());

  const [activeRow, inactiveRow, pendingRow, pendingDuesRow, enrollmentsTodayRow] =
    await Promise.all([
      db.select({ value: count() }).from(members).where(eq(members.status, "ACTIVE")),
      db.select({ value: count() }).from(members).where(eq(members.status, "INACTIVE")),
      db.select({ value: count() }).from(members).where(eq(members.status, "PENDING")),
      db
        .select({ value: sql<number>`coalesce(sum(${dues.amount}), 0)` })
        .from(dues)
        .where(eq(dues.status, "PENDING")),
      db.select({ value: count() }).from(enrollments).where(eq(enrollments.startDate, today)),
    ]);

  return {
    activeMembers: Number(activeRow[0]?.value ?? 0),
    inactiveMembers: Number(inactiveRow[0]?.value ?? 0),
    pendingMembers: Number(pendingRow[0]?.value ?? 0),
    pendingDuesAmount: Number(pendingDuesRow[0]?.value ?? 0),
    enrollmentsToday: Number(enrollmentsTodayRow[0]?.value ?? 0),
  };
}
