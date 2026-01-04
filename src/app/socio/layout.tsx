import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { MemberNavbar } from "@/components/navigation/member-navbar";
import { auth } from "@/auth";
import { findMemberByUserId } from "@/lib/members/queries";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?from=socio");
  }

  if (session.user.role !== "USER") {
    redirect("/auth/signin?from=socio");
  }

  const member = await findMemberByUserId(session.user.id);

  if (!member) {
    redirect("/auth/signin?from=socio");
  }

  return (
    <>
      <MemberNavbar />
      <div className="min-h-screen bg-base-primary px-6 pb-12 pt-28">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </>
  );
}
