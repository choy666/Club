"use client";

import { useCallback, useMemo, useState } from "react";

import { DueFilters } from "./due-filters";
import { useDueFiltersStore } from "@/store/due-filters-store";
import { useDuesList, usePayDue } from "@/hooks/use-enrollments";
import type { DueDTO } from "@/types/enrollment";

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
  const payMutation = usePayDue();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const hasData = Boolean(data?.data?.length);
  const totalPages = data?.meta.totalPages ?? 1;

  const handlePay = useCallback(
    async (due: DueDTO) => {
      const confirmed = window.confirm(
        `¿Confirmás registrar el pago de ${formatCurrency(due.amount)} para ${due.member.name ?? "Sin nombre"}?`,
      );
      if (!confirmed) return;

      try {
        await payMutation.mutateAsync({ dueId: due.id });
        setFeedback({
          type: "success",
          message: "Cuota marcada como pagada.",
        });
      } catch (mutationError) {
        console.error(mutationError);
        setFeedback({
          type: "error",
          message: "No se pudo registrar el pago.",
        });
      }
    },
    [payMutation],
  );

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
                  onClick={() => handlePay(due)}
                  disabled={due.status === "PAID" || payMutation.isPending}
                >
                  {due.status === "PAID" ? "Pagada" : "Marcar como pagada"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  }, [data, error, hasData, isLoading, handlePay, payMutation.isPending]);

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
    </section>
  );
}
