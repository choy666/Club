import type { ReactNode } from "react";

import type { MemberFinancialSnapshot } from "@/types/member";

type Tone = "critical" | "warning" | "success" | "neutral";

const toneClasses: Record<Tone, { border: string; bg: string; accent: string; glow: string }> = {
  critical: {
    border: "border-accent-critical/40",
    bg: "bg-accent-critical/5",
    accent: "text-accent-critical",
    glow: "shadow-[0_0_25px_rgba(239,68,68,0.35)]",
  },
  warning: {
    border: "border-accent-warning/40",
    bg: "bg-accent-warning/10",
    accent: "text-accent-warning-strong",
    glow: "shadow-[0_0_25px_rgba(251,191,36,0.25)]",
  },
  success: {
    border: "border-state-active/40",
    bg: "bg-state-active/10",
    accent: "text-state-active",
    glow: "shadow-[0_0_25px_rgba(74,222,128,0.25)]",
  },
  neutral: {
    border: "border-base-border/60",
    bg: "bg-base-secondary/40",
    accent: "text-base-muted",
    glow: "shadow-none",
  },
};

interface MemberFinancialAlertProps {
  snapshot?: MemberFinancialSnapshot | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

function resolveTone(snapshot?: MemberFinancialSnapshot | null): Tone {
  if (!snapshot) return "neutral";
  if (snapshot.totals.frozen > 0) return "critical";
  if (snapshot.totals.overdue > 0) return "critical";
  if (snapshot.totals.pending > 0) return "warning";
  return "success";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MemberFinancialAlert({
  snapshot,
  isLoading,
  errorMessage,
  title,
  description,
  actions,
  className,
}: MemberFinancialAlertProps) {
  const tone = resolveTone(snapshot);
  const toneClass = toneClasses[tone];

  return (
    <div
      className={`neo-panel border ${toneClass.border} ${toneClass.bg} px-6 py-6 transition ${toneClass.glow} ${className ?? ""}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-base-muted">{title}</p>
          {description && <p className="mt-1 text-sm text-base-muted/90">{description}</p>}
        </div>
        {actions && <div className="w-full md:w-auto">{actions}</div>}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="animate-pulse text-sm text-base-muted">Calculando morosidad...</div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-accent-critical/50 bg-accent-critical/10 px-4 py-3 text-sm text-accent-critical">
            {errorMessage}
          </div>
        ) : !snapshot ? (
          <div className="rounded-lg border border-dashed border-base-border/70 px-4 py-3 text-sm text-base-muted">
            Seleccioná un socio para revisar su estado financiero.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-base-muted">Estado actual</p>
              <p className={`mt-1 text-2xl font-semibold ${toneClass.accent}`}>{snapshot.status}</p>
              <span className="text-xs text-base-muted">
                Período de gracia: {snapshot.gracePeriodDays} días
              </span>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-base-muted">
                Próximo vencimiento
              </p>
              <p className="mt-1 text-2xl font-semibold">{formatDate(snapshot.nextDueDate)}</p>
              <span className="text-xs text-base-muted">Total abonado: {snapshot.totals.paid}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-base-muted">Cuotas congeladas</p>
              <p className="mt-1 text-2xl font-semibold text-accent-critical">
                {snapshot.totals.frozen}
              </p>
              <span className="text-xs text-base-muted">
                Requiere reactivar al socio para volver a cobrar
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-base-muted">Cuotas vencidas</p>
              <p className="mt-1 text-2xl font-semibold text-accent-critical">
                {snapshot.totals.overdue}
              </p>
              <span className="text-xs text-base-muted">Acceso limitado hasta regularizar</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-base-muted">Cuotas pendientes</p>
              <p className="mt-1 text-2xl font-semibold text-accent-warning-strong">
                {snapshot.totals.pending}
              </p>
              <span className="text-xs text-base-muted">
                Incluye cuotas dentro del período de gracia
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
