import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { enforceRateLimit } from "@/lib/rate-limit";

const adminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(60).optional(),
});

async function fetchExistingAdmin() {
  return db.query.users.findFirst({
    where: eq(users.role, "ADMIN"),
    columns: { id: true },
  });
}

const ADMIN_STATUS_RATE_LIMIT = {
  limit: 20,
  windowMs: 60 * 1000,
};

function rateLimitResponse(retryAfterMs?: number) {
  return NextResponse.json(
    {
      error: "Demasiadas solicitudes. Intenta nuevamente en unos instantes.",
    },
    {
      status: 429,
      headers: retryAfterMs
        ? { "Retry-After": Math.ceil(retryAfterMs / 1000).toString() }
        : undefined,
    }
  );
}

export async function GET(request: NextRequest) {
  const rate = enforceRateLimit(request, ADMIN_STATUS_RATE_LIMIT, "admin-status");
  if (!rate.success) {
    return rateLimitResponse(rate.retryAfterMs);
  }
  const admin = await fetchExistingAdmin();
  return NextResponse.json({ hasAdmin: Boolean(admin) });
}

export async function POST(request: NextRequest) {
  const rate = enforceRateLimit(request, ADMIN_STATUS_RATE_LIMIT, "admin-status");
  if (!rate.success) {
    return rateLimitResponse(rate.retryAfterMs);
  }
  const existing = await fetchExistingAdmin();

  if (existing) {
    return NextResponse.json(
      { message: "Ya existe un administrador configurado." },
      { status: 409 }
    );
  }

  const payload = adminSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { message: "Datos inválidos", issues: payload.error.flatten() },
      { status: 400 }
    );
  }

  const hashedPassword = await hashPassword(payload.data.password);

  await db.insert(users).values({
    email: payload.data.email.toLowerCase(),
    passwordHash: hashedPassword,
    role: "ADMIN",
    name: payload.data.name ?? "Administrador",
  });

  return NextResponse.json({ message: "Administrador creado correctamente." });
}
