import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

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

export async function GET() {
  const admin = await fetchExistingAdmin();
  return NextResponse.json({ hasAdmin: Boolean(admin) });
}

export async function POST(request: Request) {
  const existing = await fetchExistingAdmin();

  if (existing) {
    return NextResponse.json(
      { message: "Ya existe un administrador configurado." },
      { status: 409 },
    );
  }

  const payload = adminSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { message: "Datos inválidos", issues: payload.error.flatten() },
      { status: 400 },
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
