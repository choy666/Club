"use client";

import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { DueTable } from "@/components/enrollments/due-table";

export default function AdminEnrollmentsPage() {
  return (
    <div className="space-y-10">
      <section className="neo-panel overflow-hidden">
        <div className="relative z-10 flex flex-col gap-5 p-8">
          <div className="space-y-3">
            <span className="neo-chip">Panel administrativo</span>
            <h1 className="text-4xl font-semibold font-[var(--font-space)] tracking-tight">
              Inscripciones y cuotas
            </h1>
            <p className="max-w-3xl text-base-muted">
              Centralizá las altas y seguimiento de pagos con una vista limpia y futurista. Todo
              queda sincronizado con la base de socios.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Flujo activo", helper: "Inscripciones con cuotas vigentes" },
              { label: "Pagos monitoreados", helper: "Seguimiento en tiempo real" },
              { label: "Alertas inteligentes", helper: "Morosidad y congelamientos" },
              { label: "Automatización", helper: "Generación de cuotas mensual" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-base-muted transition hover:border-accent-primary/50 hover:text-base-foreground"
              >
                <p className="text-xs uppercase tracking-[0.3em]">{item.label}</p>
                <p className="mt-1 text-base text-base-foreground/90">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-r from-accent-primary/10 via-transparent to-transparent" />
      </section>

      <EnrollmentTable />
      <div className="neo-divider" />
      <DueTable />
    </div>
  );
}
