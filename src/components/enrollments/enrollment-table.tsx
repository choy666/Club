"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";

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
import { getErrorMessage } from "@/lib/errors-client";

type Feedback = {
  type: "success" | "error";
  message: string;
};

const STATUS_STYLES: Record<EnrollmentDTO["status"], { label: string; className: string }> = {
  ACTIVE: {
    label: "Activa",
    className: "text-state-active bg-state-active/10 border-state-active/40",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "text-accent-critical bg-accent-critical/10 border-accent-critical/40",
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
  const [formError, setFormError] = useState<string | null>(null);

  const hasData = Boolean(data?.data?.length);
  const totalPages = data?.meta.totalPages ?? 1;

  function closeModal() {
    setModalMode(null);
    setSelected(null);
    setFormError(null);
  }

  const handleCreate = useCallback(
    async (values: Parameters<typeof createMutation.mutateAsync>[0]) => {
      try {
        setFormError(null);
        await createMutation.mutateAsync(values);
        setFeedback({
          type: "success",
          message: "Inscripción creada correctamente.",
        });
        closeModal();
      } catch (mutationError) {
        clientLogger.error("Error al crear inscripción", mutationError);
        const errorMessage = getErrorMessage(
          mutationError,
          "Ocurrió un error al crear la inscripción."
        );
        setFeedback({
          type: "error",
          message: errorMessage,
        });
        setFormError(errorMessage);
      }
    },
    [createMutation]
  );

  const handleEdit = useCallback(
    async (values: Parameters<typeof updateMutation.mutateAsync>[0]["input"]) => {
      try {
        if (!selected) return;
        setFormError(null);
        await updateMutation.mutateAsync({
          enrollmentId: selected.id,
          input: values,
        });
        setFeedback({ type: "success", message: "Inscripción actualizada." });
        closeModal();
      } catch (mutationError) {
        console.error(mutationError);
        const errorMessage = getErrorMessage(
          mutationError,
          "No se pudo actualizar la inscripción."
        );
        setFeedback({
          type: "error",
          message: errorMessage,
        });
        setFormError(errorMessage);
      }
    },
    [selected, updateMutation]
  );

  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <tbody>
          {Array.from({ length: 4 }).map((_, index) => (
            <tr key={index} className="border-b border-base-border/60">
              <td colSpan={6} className="py-6 text-center text-base-muted animate-pulse">
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
                  <span className="font-semibold">{enrollment.member.name ?? "Sin nombre"}</span>
                  <span className="text-sm text-base-muted">
                    {enrollment.member.documentNumber}
                  </span>
                  <span className="text-xs text-base-muted">{enrollment.member.email}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold">{enrollment.planName ?? "Sin plan"}</span>
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

  const mobileContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`enrollment-mobile-skeleton-${index}`}
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
          No se pudieron cargar las inscripciones.
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="rounded-2xl border border-base-border/60 bg-base-secondary/30 p-4 text-center text-base-muted">
          No hay inscripciones para los filtros actuales.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data?.data.map((enrollment) => {
          const statusConfig = STATUS_STYLES[enrollment.status];
          return (
            <div
              key={`enrollment-card-${enrollment.id}`}
              className="rounded-2xl border border-base-border/70 bg-base-secondary/20 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Socio</p>
                  <p className="text-lg font-semibold">{enrollment.member.name ?? "Sin nombre"}</p>
                  <span className="text-sm text-base-muted">
                    {enrollment.member.documentNumber}
                  </span>
                  <p className="text-xs text-base-muted">{enrollment.member.email}</p>
                </div>

                <div className="rounded-xl border border-base-border/50 bg-base-secondary/40 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-widest text-base-muted">Plan / Monto</p>
                  <p className="text-base font-semibold">{enrollment.planName ?? "Sin plan"}</p>
                  <span className="text-base-muted">
                    {formatCurrency(enrollment.monthlyAmount)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                  <span className="text-base-muted">
                    Inicio: {new Date(enrollment.startDate).toLocaleDateString("es-AR")}
                  </span>
                </div>

                <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                  Generó {enrollment.monthsToGenerate} cuota(s)
                </p>

                <button
                  type="button"
                  className="btn-secondary text-xs uppercase tracking-[0.25em]"
                  onClick={() => {
                    setSelected(enrollment);
                    setModalMode("edit");
                  }}
                >
                  Editar inscripción
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [data, error, hasData, isLoading]);

  return (
    <section className="space-y-8">
      <motion.header
        className="flex flex-col gap-4 rounded-[1.75rem] border border-base-border/80 bg-white/3 px-6 py-6 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <p className="neo-chip">· Inscripciones</p>
          <h2 className="mt-2 text-3xl font-semibold font-[var(--font-space)] tracking-tight">
            Gestión de inscripciones
          </h2>
          <p className="text-sm text-base-muted">Altas, planes y cuotas con estética futurista.</p>
        </div>
        <motion.button
          type="button"
          className="btn-primary"
          onClick={() => setModalMode("create")}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          + Nueva inscripción
        </motion.button>
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

      <EnrollmentFilters />

      <div className="neo-table overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[720px] text-left text-sm text-base-muted">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.35em] text-base-muted">
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
        <div className="block md:hidden">{mobileContent}</div>
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
        title={modalMode === "create" ? "Nueva inscripción" : "Editar inscripción"}
        open={modalMode !== null}
        onClose={closeModal}
      >
        {modalMode === "create" && (
          <EnrollmentCreateForm
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
            serverError={formError}
          />
        )}
        {modalMode === "edit" && selected && (
          <EnrollmentEditForm
            initialData={selected}
            onSubmit={handleEdit}
            isSubmitting={updateMutation.isPending}
            serverError={formError}
          />
        )}
      </Modal>
    </section>
  );
}
