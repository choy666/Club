"use client";

import { useCallback, useMemo, useState } from "react";

import { DueFilters } from "./due-filters";
import { useDueFiltersStore } from "@/store/due-filters-store";
import { useDuesList } from "@/hooks/use-enrollments";
import type { DueDTO } from "@/types/enrollment";
import { Modal } from "@/components/ui/modal";
import { useRecordPayment } from "@/hooks/use-payments";
import { clientLogger } from "@/lib/client-logger";

type Feedback = {
  type: "success" | "error";
  message: string;
};

const DUE_STATUS_STYLES: Record<
  DueDTO["status"],
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pendiente",
    className: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  PAID: {
    label: "Pagada",
    className: "text-state-active bg-state-active/10 border-state-active/30",
  },
  OVERDUE: {
    label: "Vencida",
    className:
      "text-accent-critical bg-accent-critical/10 border-accent-critical/30",
  },
  FROZEN: {
    label: "Congelada",
    className: "text-base-muted bg-base-muted/10 border-base-muted/30",
  },
};

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
  const [manualPaymentError, setManualPaymentError] = useState<string | null>(
    null,
  );
  const [manualPaymentForm, setManualPaymentForm] = useState({
    amount: "",
    method: "Transferencia",
    reference: "",
    notes: "",
    paidAt: toDateTimeLocalInput(new Date()),
  });

  const hasData = Boolean(data?.data?.length);
  const totalPages = data?.meta.totalPages ?? 1;

  const openManualPayment = useCallback((due: DueDTO) => {
    setManualPaymentDue(due);
    setManualPaymentError(null);
    setManualPaymentForm({
      amount: String(due.amount),
      method: due.status === "PAID" ? "Ajuste manual" : "Transferencia",
      reference: "",
      notes: "",
      paidAt: toDateTimeLocalInput(
        due.paidAt ? new Date(due.paidAt) : new Date(),
      ),
    });
  }, []);

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
        notes: manualPaymentForm.notes.trim()
          ? manualPaymentForm.notes.trim()
          : undefined,
        paidAt: paidAtIso,
      });

      setFeedback({
        type: "success",
        message: "Pago manual registrado correctamente.",
      });
      closeManualPayment();
    } catch (mutationError) {
      clientLogger.error("Error en pago manual", mutationError);
      setManualPaymentError(
        mutationError instanceof Error
          ? mutationError.message
          : "No se pudo registrar el pago manual.",
      );
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

  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <tbody>
          {Array.from({ length: 4 }).map((_, index) => (
            <tr key={index} className="border-b border-base-border/60">
              <td
                colSpan={6}
                className="py-6 text-center text-base-muted animate-pulse"
              >
                Cargando cuotas...
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
            <td colSpan={6} className="py-6 text-center text-accent-critical">
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
            <td colSpan={6} className="py-6 text-center text-base-muted">
              No hay cuotas con los filtros actuales.
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {data?.data.map((due) => {
          const statusConfig = DUE_STATUS_STYLES[due.status];
          return (
            <tr
              key={due.id}
              className="border-b border-base-border/60 transition-colors hover:bg-base-secondary/30"
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {due.member.name ?? "Sin nombre"}
                  </span>
                  <span className="text-sm text-base-muted">
                    {due.member.documentNumber}
                  </span>
                  <span className="text-xs text-base-muted">
                    {due.member.email}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {due.enrollment.planName ?? "Sin plan"}
                  </span>
                  <span className="text-sm text-base-muted">
                    {due.enrollment.id}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-base-muted">
                {new Date(due.dueDate).toLocaleDateString("es-AR")}
              </td>
              <td className="px-6 py-4 font-semibold">
                {formatCurrency(due.amount)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </span>
                {due.paidAt && (
                  <p className="mt-1 text-xs text-base-muted">
                    Pagada: {new Date(due.paidAt).toLocaleDateString("es-AR")}
                  </p>
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1 text-xs"
                  onClick={() => openManualPayment(due)}
                  disabled={recordPaymentMutation.isPending}
                >
                  {due.status === "PAID" ? "Editar pago" : "Pago manual"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  }, [
    data,
    error,
    hasData,
    isLoading,
    openManualPayment,
    recordPaymentMutation.isPending,
  ]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.25em] text-base-muted">
          Sprint 3 · Cuotas
        </p>
        <h2 className="text-2xl font-semibold font-[var(--font-space)]">
          Seguimiento de cuotas y pagos
        </h2>
      </header>

      {feedback && (
        <div
          className={`glass-card border-l-4 px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-state-active text-state-active"
              : "border-accent-critical text-accent-critical"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{feedback.message}</span>
            <button
              type="button"
              className="text-xs uppercase tracking-widest"
              onClick={() => setFeedback(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <DueFilters />

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-base-secondary/60">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Socio
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Inscripción
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Vencimiento
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Monto
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            {tableContent}
          </table>
        </div>
        {hasData && (
          <div className="flex items-center justify-between border-t border-base-border px-6 py-4 text-sm text-base-muted">
            <span>
              Página {filters.page} de {totalPages}
            </span>
            <div className="flex gap-3">
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
                onClick={() =>
                  filters.setPage(Math.min(totalPages, filters.page + 1))
                }
                disabled={filters.page >= totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Pago manual"
        open={Boolean(manualPaymentDue)}
        onClose={closeManualPayment}
      >
        {manualPaymentDue && (
          <div className="space-y-6">
            <div className="rounded-xl border border-base-border/70 bg-base-secondary/30 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                Detalle de la cuota
              </p>
              <ul className="mt-2 space-y-1 text-base-muted">
                <li>
                  <strong>Socio:</strong>{" "}
                  {manualPaymentDue.member.name ?? "Sin nombre"}
                </li>
                <li>
                  <strong>Documento:</strong>{" "}
                  {manualPaymentDue.member.documentNumber}
                </li>
                <li>
                  <strong>Periodo:</strong>{" "}
                  {new Date(manualPaymentDue.dueDate).toLocaleDateString(
                    "es-AR",
                  )}
                </li>
                <li>
                  <strong>Monto original:</strong>{" "}
                  {formatCurrency(manualPaymentDue.amount)}
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col text-sm font-medium">
                  Método de pago
                  <input
                    type="text"
                    className="mt-1 rounded-md border border-base-border bg-base-primary px-3 py-2"
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
                <label className="flex flex-col text-sm font-medium">
                  Monto acreditado
                  <input
                    type="number"
                    min={0}
                    className="mt-1 rounded-md border border-base-border bg-base-primary px-3 py-2"
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

              <label className="flex flex-col text-sm font-medium">
                Referencia / comprobante
                <input
                  type="text"
                  className="mt-1 rounded-md border border-base-border bg-base-primary px-3 py-2"
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

              <label className="flex flex-col text-sm font-medium">
                Notas internas
                <textarea
                  className="mt-1 rounded-md border border-base-border bg-base-primary px-3 py-2"
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

              <label className="flex flex-col text-sm font-medium">
                Fecha y hora del pago
                <input
                  type="datetime-local"
                  className="mt-1 rounded-md border border-base-border bg-base-primary px-3 py-2"
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
                {recordPaymentMutation.isPending
                  ? "Procesando..."
                  : "Registrar pago manual"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

function toDateTimeLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
