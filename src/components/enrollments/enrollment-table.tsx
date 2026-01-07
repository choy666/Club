"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

import {
  useCreateEnrollment,
  useEnrollmentsList,
  useUpdateEnrollment,
  useDeleteEnrollment,
} from "@/hooks/use-enrollments";
import { useMemberCredential } from "@/hooks/use-members";
import { useEnrollmentFiltersStore } from "@/store/enrollment-filters-store";
import { EnrollmentFilters } from "./enrollment-filters";
import { Modal } from "@/components/ui/modal";
import { EnrollmentCreateForm, EnrollmentEditForm } from "./enrollment-form";
import type { EnrollmentDTO } from "@/types/enrollment";
import { clientLogger } from "@/lib/client-logger";
import { getErrorMessage } from "@/lib/errors-client";
import { MemberCredentialCard } from "@/components/credentials/member-credential-card";

type Feedback = {
  type: "success" | "error";
  message: string;
};

const STATUS_STYLES: Record<EnrollmentDTO["status"], { label: string; className: string }> = {
  PENDING: {
    label: "Pendiente",
    className: "text-amber-500 bg-amber-100/40 border-amber-500/40",
  },
  ACTIVE: {
    label: "Activa",
    className: "text-state-active bg-state-active/10 border-state-active/40",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "text-accent-critical bg-accent-critical/10 border-accent-critical/40",
  },
};

// Función utilitaria para formatear fechas consistentemente
function formatDisplayDate(dateStr: string): string {
  if (dateStr.includes('T')) {
    // Si viene como ISO, extraer solo la parte de fecha
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  } else {
    // Si ya viene como YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
}

export function EnrollmentTable() {
  const filters = useEnrollmentFiltersStore();
  const { data, isLoading, error } = useEnrollmentsList();
  const createMutation = useCreateEnrollment();
  const updateMutation = useUpdateEnrollment();
  const deleteMutation = useDeleteEnrollment();
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<EnrollmentDTO | null>(null);
  const [credentialTarget, setCredentialTarget] = useState<EnrollmentDTO | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const credentialQuery = useMemberCredential(credentialTarget?.member.id, {
    enabled: Boolean(credentialTarget),
  });

  const hasData = Boolean(data?.data?.length);
  const totalPages = data?.meta.totalPages ?? 1;
  const isDeleting = deleteMutation.isPending;

  const handleDelete = useCallback(
    async (enrollment: EnrollmentDTO) => {
      if (enrollment.hasPaidDues) {
        if (typeof window !== "undefined") {
          window.alert("No se puede eliminar una inscripción con cuotas pagadas.");
        }
        return;
      }

      const confirmed =
        typeof window === "undefined"
          ? false
          : window.confirm(
              "¿Eliminar la inscripción? Se borrarán las cuotas pendientes y el socio volverá a estado PENDING."
            );

      if (!confirmed) {
        return;
      }

      try {
        await deleteMutation.mutateAsync(enrollment.id);
        setFeedback({ type: "success", message: "Inscripción eliminada." });
      } catch (mutationError: unknown) {
        const errorMessage = getErrorMessage(mutationError, "No se pudo eliminar la inscripción.");
        setFeedback({
          type: "error",
          message: errorMessage,
        });
        if (typeof window !== "undefined") {
          window.alert(errorMessage);
        }
      }
    },
    [deleteMutation]
  );

  function closeModal() {
    setModalMode(null);
    setSelected(null);
    setFormError(null);
  }

  function closeCredentialModal() {
    setCredentialTarget(null);
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
        if (typeof window !== "undefined") {
          window.alert(errorMessage);
        }
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

  const renderTableContent = () => {
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
          const deleteDisabled = enrollment.hasPaidDues || isDeleting;

          return (
            <tr
              key={enrollment.id}
              className="border-b border-base-border/60 transition-colors hover:bg-base-secondary/30"
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold">{enrollment.member.name ?? "Sin nombre"}</span>
                  <span className="text-xs text-base-muted">{enrollment.member.email}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-base-muted">
                {enrollment.member.documentNumber}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-base-muted">
                {formatDisplayDate(enrollment.startDate)}
              </td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  className="btn-secondary px-4 py-1 text-xs"
                  onClick={() => {
                    setCredentialTarget(enrollment);
                  }}
                >
                  Ver credencial
                </button>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-4">
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
                  <button
                    type="button"
                    className="text-sm text-accent-critical hover:underline disabled:cursor-not-allowed disabled:text-base-muted"
                    disabled={deleteDisabled}
                    onClick={() => void handleDelete(enrollment)}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  const renderMobileContent = () => {
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
          const deleteDisabled = enrollment.hasPaidDues || isDeleting;
          return (
            <div
              key={`enrollment-card-${enrollment.id}`}
              className="rounded-2xl border border-base-border/70 bg-base-secondary/20 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Socio</p>
                  <p className="text-lg font-semibold">{enrollment.member.name ?? "Sin nombre"}</p>
                  <p className="text-xs text-base-muted">{enrollment.member.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-base-muted">
                  <span className="rounded-full border border-base-border/80 px-2 py-1 text-xs uppercase tracking-widest">
                    DNI {enrollment.member.documentNumber}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                  <span>Inicio: {formatDisplayDate(enrollment.startDate)}</span>
                </div>

                <div className="grid gap-2 text-xs uppercase tracking-[0.25em]">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setCredentialTarget(enrollment);
                    }}
                  >
                    Ver credencial
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary flex-1"
                      onClick={() => {
                        setSelected(enrollment);
                        setModalMode("edit");
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-accent flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deleteDisabled}
                      onClick={() => handleDelete(enrollment)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
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
          <p className="text-sm text-base-muted">Altas, bajas, cuotas y pagos a tu alcance.</p>
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
              className="text-sm text-state-active hover:underline"
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
                  DNI
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Inicio
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Credencial
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-base-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            {renderTableContent()}
          </table>
        </div>
        <div className="block md:hidden">{renderMobileContent()}</div>
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
      <Modal
        title="Credencial digital"
        open={credentialTarget !== null}
        onClose={closeCredentialModal}
      >
        {credentialTarget && (
          <MemberCredentialCard
            credential={credentialQuery.data}
            isLoading={credentialQuery.isLoading || credentialQuery.isFetching}
            error={credentialQuery.error instanceof Error ? credentialQuery.error.message : null}
            onRefresh={() => credentialQuery.refetch()}
            subtitle={`Socio ${credentialTarget.member.documentNumber}`}
          />
        )}
      </Modal>
    </section>
  );
}
