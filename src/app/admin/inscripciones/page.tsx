"use client";

import Link from "next/link";

import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { DueTable } from "@/components/enrollments/due-table";

export default function AdminEnrollmentsPage() {
  return (
    <div className="min-h-screen bg-base-primary px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-base-muted">
              Panel administrativo
            </p>
            <h1 className="text-3xl font-semibold font-[var(--font-space)]">
              Inscripciones y cuotas
            </h1>
            <p className="mt-2 max-w-2xl text-base text-base-muted">
              Gestioná altas de inscripciones, generá cuotas y controlá al día
              los pagos de cada socio. Todos los datos se sincronizan
              automáticamente con la base de socios existentes.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="btn-secondary">
              ← Volver al panel principal
            </Link>
          </div>
        </header>

        <EnrollmentTable />

        <div className="h-px w-full bg-base-border/60" />

        <DueTable />
      </div>
    </div>
  );
}
