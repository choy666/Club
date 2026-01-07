"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { DueFilters } from "./due-filters";
import { DuePaymentPanel } from "./due-payment-panel";
import { useDueFiltersStore } from "@/store/due-filters-store";
import { useDuesList } from "@/hooks/use-enrollments";
import type { DueDTO } from "@/types/enrollment";
import { Modal } from "@/components/ui/modal";
import { useRecordPayment } from "@/hooks/use-payments";
import { MemberProgressSummary } from "@/components/enrollments/member-progress-summary";
import { clientLogger } from "@/lib/client-logger";
import { getErrorMessage } from "@/lib/errors-client";

type Feedback = {
  type: "success" | "error";
  message: string;
};


export type MemberSummary = {
  member: DueDTO["member"];
  dues: DueDTO[];
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  frozenCount: number;
  amountDue: number;
};

const MEMBER_STATUS_STYLES = {
  healthy: {
    label: "Al día",
    className: "text-state-active bg-state-active/10 border-state-active/40",
  },
  warning: {
    label: "Con pendientes",
    className: "text-amber-500 bg-amber-500/10 border-amber-500/40",
  },
  frozen: {
    label: "Congelado",
    className: "text-base-muted bg-base-muted/10 border-base-muted/40",
  },
  critical: {
    label: "En mora",
    className: "text-accent-critical bg-accent-critical/10 border-accent-critical/40",
  },
};

function getMemberFinancialStatus(summary: MemberSummary) {
  if (summary.overdueCount > 0) {
    return MEMBER_STATUS_STYLES.critical;
  }
  if (summary.pendingCount > 0) {
    return MEMBER_STATUS_STYLES.warning;
  }
  if (summary.frozenCount > 0) {
    return MEMBER_STATUS_STYLES.frozen;
  }
  return MEMBER_STATUS_STYLES.healthy;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

export function DueTable() {
  const filters = useDueFiltersStore();
  const { data, isLoading, error } = useDuesList();
  const recordPaymentMutation = useRecordPayment();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [manualPaymentDue, setManualPaymentDue] = useState<DueDTO | null>(null);
  const [manualPaymentError, setManualPaymentError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<MemberSummary | null>(null);
  const [paymentPanelMember, setPaymentPanelMember] = useState<{ id: string; name: string } | null>(
    null
  );
  const [manualPaymentForm, setManualPaymentForm] = useState({
    amount: "",
    method: "Transferencia",
    reference: "",
    notes: "",
    paidAt: toDateTimeLocalInput(new Date()),
  });

  const duesData = data?.data;

  const memberSummaries = useMemo(() => {
    if (!duesData) {
      return [];
    }

    const summariesMap = new Map<string, MemberSummary>();

    for (const due of duesData) {
      let summary = summariesMap.get(due.member.id);
      if (!summary) {
        summary = {
          member: due.member,
          dues: [],
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0,
          frozenCount: 0,
          amountDue: 0,
        };
        summariesMap.set(due.member.id, summary);
      }

      summary.dues.push(due);
      switch (due.status) {
        case "PAID":
          summary.paidCount += 1;
          break;
        case "PENDING":
          summary.pendingCount += 1;
          summary.amountDue += due.amount;
          break;
        case "OVERDUE":
          summary.overdueCount += 1;
          summary.amountDue += due.amount;
          break;
        case "FROZEN":
          summary.frozenCount += 1;
          break;
        default:
          break;
      }
    }

    return Array.from(summariesMap.values()).sort((a, b) => {
      const nameA = a.member.name ?? "";
      const nameB = b.member.name ?? "";
      return nameA.localeCompare(nameB, "es");
    });
  }, [duesData]);

  const hasData = memberSummaries.length > 0;
  const totalPages = data?.meta.totalPages ?? 1;


  const closeManualPayment = useCallback(() => {
    setManualPaymentDue(null);
  }, []);

  const handleManualPaymentSubmit = useCallback(async () => {
    if (!manualPaymentDue) return;
    setManualPaymentError(null);
    const amountNumber = Number(manualPaymentForm.amount);

    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setManualPaymentError("El monto debe ser un número positivo.");
      return;
    }

    if (!manualPaymentForm.method.trim()) {
      setManualPaymentError("Debes indicar un método de pago.");
      return;
    }

    const paidAtIso = manualPaymentForm.paidAt
      ? new Date(manualPaymentForm.paidAt).toISOString()
      : undefined;

    try {
      await recordPaymentMutation.mutateAsync({
        dueId: manualPaymentDue.id,
        amount: amountNumber,
        method: manualPaymentForm.method.trim(),
        reference: manualPaymentForm.reference.trim()
          ? manualPaymentForm.reference.trim()
          : undefined,
        notes: manualPaymentForm.notes.trim() ? manualPaymentForm.notes.trim() : undefined,
        paidAt: paidAtIso,
      });

      setFeedback({
        type: "success",
        message: "Pago manual registrado correctamente.",
      });
      closeManualPayment();
    } catch (mutationError) {
      clientLogger.error("Error en pago manual", mutationError);
      setManualPaymentError(getErrorMessage(mutationError, "No se pudo registrar el pago manual."));
    }
  }, [
    manualPaymentDue,
    manualPaymentForm.amount,
    manualPaymentForm.method,
    manualPaymentForm.notes,
    manualPaymentForm.paidAt,
    manualPaymentForm.reference,
    recordPaymentMutation,
    closeManualPayment,
  ]);

  const renderSummaryTable = () => {
    if (isLoading) {
      return (
        <tbody>
          {Array.from({ length: 4 }).map((_, index) => (
            <tr key={`summary-skeleton-${index}`} className="border-b border-base-border/60">
              <td colSpan={7} className="py-6 text-center text-base-muted animate-pulse">
                Cargando seguimiento de socios...
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (error) {
      return (
        <tbody>
          <tr>
            <td colSpan={7} className="py-6 text-center text-accent-critical">
              No se pudieron cargar las cuotas.
            </td>
          </tr>
        </tbody>
      );
    }

    if (!hasData) {
      return (
        <tbody>
          <tr>
            <td colSpan={7} className="py-6 text-center text-base-muted">
              No hay socios con cuotas para los filtros actuales.
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {memberSummaries.map((summary) => {
          const statusConfig = getMemberFinancialStatus(summary);
          const pendingTotal = summary.pendingCount + summary.overdueCount + summary.frozenCount;
          return (
            <tr
              key={summary.member.id}
              className="border-b border-base-border/60 transition-colors hover:bg-base-secondary/30"
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold">{summary.member.name ?? "Sin nombre"}</span>
                  <span className="text-xs text-base-muted">{summary.member.email}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-base-muted">{summary.member.documentNumber}</td>
              <td className="px-6 py-4 text-sm">
                <span className="font-semibold">{summary.paidCount}</span>
                <span className="text-xs text-base-muted"> / {summary.dues.length}</span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span className="font-semibold">{pendingTotal}</span>
                <span className="text-xs text-base-muted"> cuotas</span>
              </td>
              <td className="px-6 py-4 font-semibold">{formatCurrency(summary.amountDue)}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {pendingTotal > 0 && (
                    <button
                      type="button"
                      className="btn-primary px-4 py-1 text-xs"
                      onClick={() =>
                        setPaymentPanelMember({
                          id: summary.member.id,
                          name: summary.member.name ?? "Sin nombre",
                        })
                      }
                    >
                      Pagar cuotas
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary px-4 py-1 text-xs"
                    onClick={() => setSelectedSummary(summary)}
                  >
                    Ver seguimiento
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  const renderMobileCards = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`summary-mobile-skeleton-${index}`}
              className="rounded-2xl border border-base-border/60 bg-base-secondary/30 p-4 animate-pulse"
            >
              <div className="h-4 w-32 rounded bg-base-border/50" />
              <div className="mt-3 h-3 w-24 rounded bg-base-border/40" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-accent-critical/60 bg-accent-critical/10 p-4 text-sm text-accent-critical">
          No se pudieron cargar las cuotas.
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="rounded-2xl border border-base-border/60 bg-base-secondary/30 p-4 text-center text-base-muted">
          No hay socios con cuotas para los filtros actuales.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {memberSummaries.map((summary) => {
          const statusConfig = getMemberFinancialStatus(summary);
          const pendingTotal = summary.pendingCount + summary.overdueCount + summary.frozenCount;
          return (
            <div
              key={`member-summary-${summary.member.id}`}
              className="rounded-2xl border border-base-border/70 bg-base-secondary/20 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Socio</p>
                  <p className="text-lg font-semibold">{summary.member.name ?? "Sin nombre"}</p>
                  <p className="text-xs text-base-muted">{summary.member.email}</p>
                </div>
                <div className="text-sm text-base-muted">
                  <span className="rounded-full border border-base-border/80 px-2 py-1 text-xs uppercase tracking-widest">
                    DNI {summary.member.documentNumber}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                      Cuotas pagadas
                    </p>
                    <p className="text-lg font-semibold">{summary.paidCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                      Cuotas pendientes
                    </p>
                    <p className="text-lg font-semibold">{pendingTotal}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                      Monto adeudado
                    </p>
                    <p className="text-lg font-semibold">{formatCurrency(summary.amountDue)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-xs uppercase tracking-[0.25em]"
                  onClick={() => setSelectedSummary(summary)}
                >
                  Ver seguimiento
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="space-y-8">
      <motion.header
        className="flex flex-col gap-3 rounded-[1.75rem] border border-base-border/80 bg-white/3 px-6 py-6 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <div>
          <p className="neo-chip">· Cuotas</p>
          <h2 className="mt-2 text-3xl font-semibold font-[var(--font-space)] tracking-tight">
            Seguimiento de cuotas y pagos
          </h2>
          <p className="text-sm text-base-muted">
            Controlá vencimientos, pagos manuales y estados en un panel holográfico.
          </p>
        </div>
        <motion.div
          className="rounded-full border border-base-border/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-base-muted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Actualizado en {new Date().toLocaleDateString("es-AR")}
        </motion.div>
      </motion.header>

      {feedback && (
        <motion.div
          className={`neo-panel border-l-4 px-5 py-4 text-sm ${
            feedback.type === "success"
              ? "border-state-active text-state-active"
              : "border-accent-critical text-accent-critical"
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{feedback.message}</span>
            <button
              type="button"
              className="text-[0.65rem] uppercase tracking-[0.35em]"
              onClick={() => setFeedback(null)}
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      )}

      <DueFilters />

      <div className="neo-table overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[720px] text-left text-sm text-base-muted">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.35em] text-base-muted">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Socio
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  DNI
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Cuotas / Pagadas
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Cuotas / Pendientes
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Monto adeudado
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            {renderSummaryTable()}
          </table>
        </div>
        <div className="block md:hidden">{renderMobileCards()}</div>
        {hasData && (
          <div className="flex flex-col gap-3 border-t border-base-border/70 px-6 py-4 text-sm text-base-muted md:flex-row md:items-center md:justify-between">
            <span className="text-center md:text-left">
              Página {filters.page} de {totalPages}
            </span>
            <div className="flex justify-center gap-3 md:justify-end">
              <button
                type="button"
                className="btn-secondary px-4 py-1 text-xs"
                onClick={() => filters.setPage(Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn-secondary px-4 py-1 text-xs"
                onClick={() => filters.setPage(Math.min(totalPages, filters.page + 1))}
                disabled={filters.page >= totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Seguimiento de socio"
        open={Boolean(selectedSummary)}
        onClose={() => setSelectedSummary(null)}
      >
        {selectedSummary && (
          <div className="space-y-6">
            <div className="neo-panel border border-base-border/60 px-5 py-4 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Datos del socio</p>
              <p className="text-lg font-semibold">
                {selectedSummary.member.name ?? "Sin nombre"} ·{" "}
                {selectedSummary.member.documentNumber}
              </p>
              <p className="text-sm text-base-muted">{selectedSummary.member.email}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Cuotas pagadas",
                  value: selectedSummary.paidCount,
                },
                {
                  label: "Cuotas pendientes",
                  value:
                    selectedSummary.pendingCount +
                    selectedSummary.overdueCount +
                    selectedSummary.frozenCount,
                },
                {
                  label: "Monto adeudado",
                  value: formatCurrency(selectedSummary.amountDue),
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-base-border/60 bg-base-secondary/20 px-4 py-3 text-center"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar circular y estadísticas */}
            <div className="flex flex-col items-center space-y-4">
              <MemberProgressSummary memberSummary={selectedSummary} />
            </div>

            <div className="space-y-4">
              <div className="neo-panel space-y-3 border border-base-border/70 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                    Historial de pagos
                  </p>
                  <span className="text-xs text-base-muted">
                    {selectedSummary.paidCount} registro(s)
                  </span>
                </div>
                {selectedSummary.dues.filter((due) => due.status === "PAID").length === 0 && (
                  <p className="text-sm text-base-muted">Sin pagos registrados todavía.</p>
                )}
                <div className="space-y-2">
                  {selectedSummary.dues
                    .filter((due) => due.status === "PAID")
                    .map((due) => (
                      <div
                        key={`paid-${due.id}`}
                        className="flex flex-wrap items-center justify-between rounded-xl border border-base-border/60 bg-base-secondary/10 px-4 py-2 text-sm"
                      >
                        <div>
                          <p className="font-semibold">
                            {formatCurrency(due.amount)} ·{" "}
                            {new Date(due.dueDate).toLocaleDateString("es-AR")}
                          </p>
                          {due.paidAt && (
                            <p className="text-xs text-base-muted">
                              Pagada {new Date(due.paidAt).toLocaleDateString("es-AR")}
                            </p>
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-[0.3em] text-state-active">
                          Pagada
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal title="Pago manual" open={Boolean(manualPaymentDue)} onClose={closeManualPayment}>
        {manualPaymentDue && (
          <div className="space-y-6">
            <div className="neo-panel border border-base-border/70 px-5 py-4 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                Detalle de la cuota
              </p>
              <ul className="mt-2 space-y-1 text-base-muted">
                <li>
                  <strong>Socio:</strong> {manualPaymentDue.member.name ?? "Sin nombre"}
                </li>
                <li>
                  <strong>Documento:</strong> {manualPaymentDue.member.documentNumber}
                </li>
                <li>
                  <strong>Periodo:</strong>{" "}
                  {new Date(manualPaymentDue.dueDate).toLocaleDateString("es-AR")}
                </li>
                <li>
                  <strong>Monto original:</strong> {formatCurrency(manualPaymentDue.amount)}
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-base-muted">
                  Método de pago
                  <input
                    type="text"
                    className="input-minimal mt-2"
                    value={manualPaymentForm.method}
                    onChange={(event) =>
                      setManualPaymentForm((prev) => ({
                        ...prev,
                        method: event.target.value,
                      }))
                    }
                    placeholder="Transferencia, efectivo, etc."
                  />
                </label>
                <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-base-muted">
                  Monto acreditado
                  <input
                    type="number"
                    min={0}
                    className="input-minimal mt-2"
                    value={manualPaymentForm.amount}
                    onChange={(event) =>
                      setManualPaymentForm((prev) => ({
                        ...prev,
                        amount: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-base-muted">
                Referencia / comprobante
                <input
                  type="text"
                  className="input-minimal mt-2"
                  value={manualPaymentForm.reference}
                  onChange={(event) =>
                    setManualPaymentForm((prev) => ({
                      ...prev,
                      reference: event.target.value,
                    }))
                  }
                  placeholder="ID de transferencia, número de recibo, etc."
                />
              </label>

              <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-base-muted">
                Notas internas
                <textarea
                  className="input-minimal mt-2"
                  rows={3}
                  value={manualPaymentForm.notes}
                  onChange={(event) =>
                    setManualPaymentForm((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Observaciones para tesorería"
                />
              </label>

              <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-base-muted">
                Fecha y hora del pago
                <input
                  type="datetime-local"
                  className="input-minimal mt-2"
                  value={manualPaymentForm.paidAt}
                  onChange={(event) =>
                    setManualPaymentForm((prev) => ({
                      ...prev,
                      paidAt: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {manualPaymentError && (
              <div className="rounded-lg border border-accent-critical/50 bg-accent-critical/10 px-4 py-3 text-sm text-accent-critical">
                {manualPaymentError}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeManualPayment}
                disabled={recordPaymentMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleManualPaymentSubmit}
                disabled={recordPaymentMutation.isPending}
              >
                {recordPaymentMutation.isPending ? "Procesando..." : "Registrar pago manual"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Pagos Masivos */}
      {paymentPanelMember && (
        <Modal
          open={!!paymentPanelMember}
          onClose={() => setPaymentPanelMember(null)}
          title="Pago de Cuotas"
        >
          <DuePaymentPanel
            memberId={paymentPanelMember.id}
            memberName={paymentPanelMember.name}
            dues={duesData?.filter((due) => due.member.id === paymentPanelMember.id) || []}
            onClose={() => setPaymentPanelMember(null)}
          />
        </Modal>
      )}
    </section>
  );
}

function toDateTimeLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
