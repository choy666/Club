import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { dues } from "@/db/schema";
import type { MemberStatus } from "@/types/member";

const FREEZEABLE_STATUSES = ["PENDING", "OVERDUE"] as const;

export async function freezeMemberDues(memberId: string) {
  await db
    .update(dues)
    .set({
      status: "FROZEN",
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(dues.memberId, memberId),
        inArray(dues.status, FREEZEABLE_STATUSES),
      ),
    );
}

export async function unfreezeMemberDues(memberId: string) {
  await db
    .update(dues)
    .set({
      status: "PENDING",
      updatedAt: sql`now()`,
    })
    .where(and(eq(dues.memberId, memberId), eq(dues.status, "FROZEN")));
}

export async function enforceFrozenDuesPolicy(
  memberId: string,
  status: MemberStatus,
) {
  if (status === "INACTIVE") {
    await freezeMemberDues(memberId);
    return;
  }
  await unfreezeMemberDues(memberId);
}
