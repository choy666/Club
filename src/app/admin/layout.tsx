import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminNavbar } from "@/components/navigation/admin-navbar";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?from=admin");
  }

  return (
    <>
      <AdminNavbar />
      <div className="relative min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="page-shell">{children}</div>
      </div>
    </>
  );
}
