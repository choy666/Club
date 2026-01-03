import { StatusBadge } from "./status-badge";
import type { MemberDTO, MemberFinancialSnapshot } from "@/types/member";

interface MemberProfileCardProps {
  member: MemberDTO;
  snapshot?: MemberFinancialSnapshot | null;
}

const infoEntries: Array<{
  label: string;
  value: (member: MemberDTO) => string | null;
}> = [
  { label: "Nombre completo", value: (m) => m.name ?? "—" },
  { label: "Correo", value: (m) => m.email },
  { label: "Documento", value: (m) => m.documentNumber },
  { label: "Teléfono", value: (m) => m.phone ?? "—" },
  { label: "Dirección", value: (m) => m.address ?? "—" },
  {
    label: "Fecha de nacimiento",
    value: (m) =>
      m.birthDate
        ? new Date(m.birthDate).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "—",
  },
];

function getFinancialBanner(snapshot?: MemberFinancialSnapshot | null) {
  if (!snapshot) return null;

  if (snapshot.totals.frozen > 0) {
    return {
      tone: "critical" as const,
      title: "Cuotas congeladas",
      message:
        "El socio está inactivo y sus cuotas fueron congeladas. Reactivá la membresía para retomar los cobros.",
      detail: `Cuotas congeladas: ${snapshot.totals.frozen}`,
    };
  }

  if (snapshot.totals.overdue > 0) {
    return {
      tone: "critical" as const,
      title: "Pagos vencidos",
      message:
        "Hay cuotas vencidas. Regularizá tu situación para reactivar el acceso completo.",
      detail: `Cuotas vencidas: ${snapshot.totals.overdue}`,
    };
  }

  if (snapshot.totals.pending > 0) {
    return {
      tone: "warning" as const,
      title: "Pagos pendientes",
      message:
        "Tenés cuotas próximas a vencer. Aprovechá el período de gracia para pagarlas a tiempo.",
      detail: `Cuotas próximas: ${snapshot.totals.pending}`,
    };
  }

  return {
    tone: "success" as const,
    title: "Cuenta al día",
    message: "No registramos cuotas pendientes. ¡Gracias por estar al día!",
    detail: null,
  };
}

export function MemberProfileCard({
  member,
  snapshot,
}: MemberProfileCardProps) {
  const banner = getFinancialBanner(snapshot);

  return (
    <div className="glass-card border border-base-border/60 px-6 py-8 space-y-8">
      {banner && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 ${
            banner.tone === "critical"
              ? "border-accent-critical/50 bg-accent-critical/10 text-accent-critical"
              : banner.tone === "warning"
                ? "border-accent-warning/50 bg-accent-warning/10 text-accent-warning-strong"
                : "border-state-active/50 bg-state-active/10 text-state-active"
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold tracking-wide uppercase">
              {banner.title}
            </span>
            <p className="text-sm">{banner.message}</p>
            {banner.detail && (
              <span className="text-xs text-base-muted/90">
                {banner.detail}
              </span>
            )}
          </div>
        </div>
      )}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
            Perfil del socio
          </p>
          <h2 className="text-3xl font-semibold font-[var(--font-space)]">
            {member.name ?? "Socio registrado"}
          </h2>
        </div>
        <StatusBadge status={member.status} />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {infoEntries.map((entry) => (
          <div
            key={entry.label}
            className="rounded-xl border border-base-border/70 px-4 py-3 bg-base-secondary/30"
          >
            <p className="text-xs uppercase tracking-widest text-base-muted">
              {entry.label}
            </p>
            <p className="text-lg font-medium mt-1">{entry.value(member)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-base-border/70 bg-base-secondary/30 px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-base-muted">
          Notas
        </p>
        <p className="mt-2 text-base-muted">
          {member.notes?.trim() ? member.notes : "Sin anotaciones adicionales."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-base-border/70 bg-base-secondary/30 px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-base-muted">
            Creado
          </p>
          <p className="mt-1 text-lg font-medium">
            {new Date(member.createdAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="rounded-xl border border-base-border/70 bg-base-secondary/30 px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-base-muted">
            Última actualización
          </p>
          <p className="mt-1 text-lg font-medium">
            {new Date(member.updatedAt).toLocaleString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
