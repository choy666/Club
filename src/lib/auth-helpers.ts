import { auth } from "@/auth";
import { AppError } from "@/lib/errors";

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AppError("No autenticado.", 401);
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();

  if (session.user.role !== "ADMIN") {
    throw new AppError("No autorizado.", 403);
  }

  return session;
}

export async function requireMemberSession(targetUserId?: string) {
  const session = await requireSession();

  if (session.user.role === "ADMIN") {
    return session;
  }

  if (targetUserId && session.user.id !== targetUserId) {
    throw new AppError("No autorizado.", 403);
  }

  return session;
}
