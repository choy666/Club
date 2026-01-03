"use client";

import { useMemo, useState, useCallback } from "react";

import {
  useCreateEnrollment,
  useEnrollmentsList,
  useUpdateEnrollment,
} from "@/hooks/use-enrollments";
import { useEnrollmentFiltersStore } from "@/store/enrollment-filters-store";
import { EnrollmentFilters } from "./enrollment-filters";
import { Modal } from "@/components/ui/modal";
import { EnrollmentCreateForm, EnrollmentEditForm } from "./enrollment-form";
import type { EnrollmentDTO } from "@/types/enrollment";
import { clientLogger } from "@/lib/client-logger";

type Feedback = {
  type: "success" | "error";
  message: string;
};

const STATUS_STYLES: Record<
  EnrollmentDTO["status"],
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Activa",
    className: "text-state-active bg-state-active/10 border-state-active/40",
  },
  CANCELLED: {
    label: "Cancelada",
    className:
      "text-accent-critical bg-accent-critical/10 border-accent-critical/40",
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

export function EnrollmentTable() {
  const filters = useEnrollmentFiltersStore();
  const { data, isLoading, error } = useEnrollmentsList();
  const createMutation = useCreateEnrollment();
  const updateMutation = useUpdateEnrollment();
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<EnrollmentDTO | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const hasData = Boolean(data?.data?.length);
  const totalPages = data?.meta.totalPages ?? 1;

  function closeModal() {
    setModalMode(null);
    setSelected(null);
  }

  const handleCreate = useCallback(
    async (values: Parameters<typeof createMutation.mutateAsync>[0]) => {
      try {
        await createMutation.mutateAsync(values);
        setFeedback({
          type: "success",
          message: "Inscripción creada correctamente.",
        });
        closeModal();
      } catch (mutationError) {
        clientLogger.error("Error al crear inscripción", mutationError);
        setFeedback({
          type: "error",
          message: "Ocurrió un error al crear la inscripción.",
        });
      }
    },
    [createMutation],
  );

  const handleEdit = useCallback(
    async (
      values: Parameters<typeof updateMutation.mutateAsync>[0]["input"],
    ) => {
      try {
        if (!selected) return;
        await updateMutation.mutateAsync({
          enrollmentId: selected.id,
          input: values,
        });
        setFeedback({ type: "success", message: "Inscripción actualizada." });
        closeModal();
      } catch (mutationError) {
        console.error(mutationError);
        setFeedback({
          type: "error",
          message: "No se pudo actualizar la inscripción.",
        });
      }
    },
    [selected, updateMutation],
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
                Cargando inscripciones...
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
              No se pudieron cargar las inscripciones.
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
              No hay inscripciones para los filtros actuales.
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {data?.data.map((enrollment) => {
          const statusConfig = STATUS_STYLES[enrollment.status];
          return (
            <tr
              key={enrollment.id}
              className="border-b border-base-border/60 transition-colors hover:bg-base-secondary/30"
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {enrollment.member.name ?? "Sin nombre"}
                  </span>
                  <span className="text-sm text-base-muted">
                    {enrollment.member.documentNumber}
                  </span>
                  <span className="text-xs text-base-muted">
                    {enrollment.member.email}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {enrollment.planName ?? "Sin plan"}
                  </span>
                  <span className="text-sm text-base-muted">
                    {formatCurrency(enrollment.monthlyAmount)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-base-muted">
                {new Date(enrollment.startDate).toLocaleDateString("es-AR")}
              </td>
              <td className="px-6 py-4 text-sm text-base-muted">
                Generó {enrollment.monthsToGenerate} cuota(s)
              </td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  className="text-sm text-accent-primary hover:underline"
                  onClick={() => {
                    setSelected(enrollment);
                    setModalMode("edit");
                  }}
                >
                  Editar
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  }, [data, error, hasData, isLoading]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-base-muted">
            Sprint 3 · Inscripciones
          </p>
          <h2 className="text-2xl font-semibold font-[var(--font-space)]">
            Gestión de inscripciones
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalMode("create")}
          >
            + Nueva inscripción
          </button>
        </div>
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

      <EnrollmentFilters />

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-base-secondary/60">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Socio
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Plan / Monto
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Inicio
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Cuotas
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
        title={
          modalMode === "create" ? "Nueva inscripción" : "Editar inscripción"
        }
        open={modalMode !== null}
        onClose={closeModal}
      >
        {modalMode === "create" && (
          <EnrollmentCreateForm
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />
        )}
        {modalMode === "edit" && selected && (
          <EnrollmentEditForm
            initialData={selected}
            onSubmit={handleEdit}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>
    </section>
  );
}
