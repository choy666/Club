"use client";

import { useMemo, useEffect } from "react";
import { useMemberDuesStats } from "@/hooks/use-member-stats";
import { useMemberCurrentDues } from "@/hooks/use-member-current-dues";
import { getCredentialStatus } from "@/lib/utils/member-status-utils";
import { fromLocalDateOnly, addMonthsLocal } from "@/lib/utils/date-utils";

import type { MemberCredentialDTO } from "@/types/enrollment";

interface MemberCredentialCardProps {
  credential?: MemberCredentialDTO | null;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
}

export function MemberCredentialCard({
  credential,
  isLoading,
  error,
  title = "Credencial digital",
  subtitle = "Acceso a tu estado de socio y beneficios. Se activa automáticamente con tu inscripción.",
}: MemberCredentialCardProps) {
  // Obtener estadísticas de cuotas
  const { data: duesStats } = useMemberDuesStats(credential?.member.id || "");

  // Obtener cuotas del mes actual
  const { data: currentDuesData } = useMemberCurrentDues(credential?.member.id || "");

  // Debug logs para estadísticas
  console.log("🔍 [CREDENTIAL] Componente de credencial renderizado");
  console.log("📊 [CREDENTIAL] credential?.member.id:", credential?.member.id);
  console.log("💳 [CREDENTIAL] duesStats:", duesStats);
  console.log("💳 [CREDENTIAL] currentDuesData:", currentDuesData);
  console.log("🔍 [CREDENTIAL] TIPO DE DATOS:");
  console.log("  - credential tipo:", typeof credential);
  console.log("  - credential es null:", credential === null);
  console.log("  - duesStats tipo:", typeof duesStats);
  console.log("  - duesStats es null:", duesStats === null);

  // Forzar cálculo del status siempre para debug
  console.log("🔄 [CREDENTIAL] Forzando cálculo de status para debug");
  const statusForzado = getCredentialStatus(credential || null, duesStats || null);
  console.log("🎯 [CREDENTIAL] Status forzado:", statusForzado);

  // Efecto para detectar cambios en los datos
  useEffect(() => {
    console.log("🔄 [CREDENTIAL] useEffect detectado cambio en datos");
    console.log("📊 [CREDENTIAL] credential cambió:", credential);
    console.log("📊 [CREDENTIAL] duesStats cambió:", duesStats);

    if (credential && duesStats) {
      const nuevoStatus = getCredentialStatus(credential, duesStats);
      console.log("🎯 [CREDENTIAL] Nuevo status calculado en useEffect:", nuevoStatus);
    }
  }, [credential, duesStats]);

  const status = useMemo(() => {
    console.log("🔄 [CREDENTIAL CARD] useMemo ejecutado - calculando status");
    console.log("📊 [CREDENTIAL CARD] Datos en useMemo:");
    console.log("  - credential?.member.id:", credential?.member?.id);
    console.log("  - credential:", credential);
    console.log("  - duesStats:", duesStats);

    const result = getCredentialStatus(credential || null, duesStats || null);

    console.log("🎯 [CREDENTIAL CARD] Status calculado en useMemo:", result);

    return result;
  }, [credential, duesStats]);

  return (
    <div className="neo-panel space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="neo-chip">{status.label}</p>
          <h3 className="text-2xl font-semibold font-[var(--font-space)]">{title}</h3>
          <p className="text-sm text-base-muted">{subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-base-border/60 bg-base-secondary/30 p-6 text-sm text-base-muted animate-pulse">
          Preparando credencial...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-accent-critical/60 bg-accent-critical/10 p-6 text-sm text-accent-critical">
          {error}
        </div>
      ) : !credential ? (
        <div className="rounded-lg border border-dashed border-base-border/70 p-6 text-sm text-base-muted">
          Aún no hay datos de credencial para este socio.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
            {/* Información principal del socio */}
            <div className="space-y-4">
              <div className="rounded-xl border border-base-border/60 bg-gradient-to-br from-base-secondary/30 to-base-secondary/10 px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
                    <span className="text-accent-primary font-semibold text-lg">
                      {credential?.member.name?.charAt(0).toUpperCase() || "S"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Socio</p>
                    <p className="text-lg font-semibold">
                      {credential?.member.name ?? credential?.member.documentNumber}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-base-muted">{credential?.member.email}</p>
              </div>

              <div className="rounded-xl border border-base-border/60 bg-base-secondary/20 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Inscripción</p>
                {credential?.enrollment ? (
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-base-muted">Plan:</span>
                      <span className="font-semibold">{credential.enrollment.planName ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-muted">Fecha:</span>
                      <span className="font-semibold">
                        {(() => {
                          const dateStr = credential.enrollment.startDate;
                          const [year, month, day] = dateStr.split("-");
                          return `${day}/${month}/${year}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-muted">Monto:</span>
                      <span className="font-semibold text-accent-primary">
                        ${credential.enrollment.monthlyAmount.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-base-muted">
                    Todavía no tiene una inscripción asociada.
                  </p>
                )}
              </div>
            </div>

            {/* Estado y progreso - centrado verticalmente */}
            <div className="flex justify-center">
              <div className="rounded-xl border border-base-border/60 bg-gradient-to-br from-blue-500/5 to-blue-600/10 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-muted mb-3">
                  Estado Crediticio
                </p>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-accent-primary">
                      {duesStats?.paidCount || 0}
                    </p>
                    <p className="text-sm text-base-muted">cuotas pagadas</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-base-muted">Progreso vitalicio:</span>
                      <span className="font-semibold">{duesStats?.percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${duesStats?.percentage || 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-base-muted text-center">
                      {(duesStats?.paidCount || 0) >= 360 ? (
                        // Socio Vitalicio completado
                        <>
                          Socio Vitalicio 🥇
                          {/* Mostrar fecha de baja para vitalicios inactivos */}
                          {credential?.member.status === "INACTIVE" && (
                            <div className="mt-2 pt-2 border-t border-base-border/30">
                              <span className="text-xs text-base-muted">
                                Baja desde:{" "}
                                {(() => {
                                  // Usar updatedAt del enrollment como fecha de cambio de estado
                                  const enrollment = credential?.enrollment;
                                  if (enrollment && enrollment.updatedAt) {
                                    const updateDate = new Date(enrollment.updatedAt);
                                    const day = String(updateDate.getDate()).padStart(2, "0");
                                    const month = String(updateDate.getMonth() + 1).padStart(
                                      2,
                                      "0"
                                    );
                                    const year = updateDate.getFullYear();
                                    return `${day}/${month}/${year}`;
                                  }
                                  return "Desconocida";
                                })()}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        // Socio regular o en progreso
                        <>
                          {360 - (duesStats?.paidCount || 0)} cuotas restantes para socio vitalicio
                          {/* Mostrar cobertura para socios regulares (activos e inactivos) */}
                          <div className="mt-2 pt-2 border-t border-base-border/30">
                            <span className="text-xs text-base-muted">
                              {(() => {
                                // Calcular fecha de vencimiento de cobertura usando fechas locales
                                if (credential?.enrollment?.startDate) {
                                  const enrollmentDate = fromLocalDateOnly(
                                    credential.enrollment.startDate
                                  );
                                  // Calcular meses de cobertura: las cuotas pagadas ya incluyen el mes de inscripción
                                  const coverageMonths = duesStats?.paidCount || 0;
                                  // Usar utilidad local para agregar meses manteniendo timezone
                                  const coverageDate = addMonthsLocal(
                                    enrollmentDate,
                                    coverageMonths
                                  );
                                  const day = String(coverageDate.getDate()).padStart(2, "0");
                                  const month = String(coverageDate.getMonth() + 1).padStart(
                                    2,
                                    "0"
                                  );
                                  const year = coverageDate.getFullYear();
                                  return `Cobertura hasta: ${day}/${month}/${year}`;
                                }
                                return "Fecha no disponible";
                              })()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner de estado */}
          <div
            className={`rounded-xl border px-5 py-4 text-center ${
              status.tone === "success"
                ? "border-state-active/30 bg-state-active/5 text-state-active"
                : status.tone === "warning"
                  ? "border-accent-warning/30 bg-accent-warning/5 text-accent-warning"
                  : "border-base-border/30 bg-base-secondary/10 text-base-muted"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  status.tone === "success"
                    ? "bg-state-active"
                    : status.tone === "warning"
                      ? "bg-accent-warning"
                      : "bg-base-border"
                }`}
              />
              <span className="font-semibold">{status.label}</span>
            </div>
            <p className="text-sm mt-1 opacity-80">
              {status.message || "Esperando datos para generar tu credencial"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
