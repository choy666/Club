"use client";

import { useMemo, useState } from "react";

import { clientLogger } from "@/lib/client-logger";
import { getErrorMessage } from "@/lib/errors-client";
import { MemberTable } from "@/components/members/member-table";
import { Modal } from "@/components/ui/modal";
import { MemberForm } from "@/components/members/member-form";
import { MemberFinancialAlert } from "@/components/members/member-financial-alert";
import type { MemberDTO } from "@/types/member";
import {
  useCreateMember,
  useMemberFinancialSnapshot,
  useMembersList,
  useUpdateMember,
} from "@/hooks/use-members";

type Feedback = {
  type: "success" | "error";
  message: string;
};

export default function AdminMembersPage() {
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [highlightMemberId, setHighlightMemberId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember();
  const membersListQuery = useMembersList();

  const eligibleMembers = useMemo(() => {
    const members = membersListQuery.data?.data ?? [];
    return members.filter((member) => member.status === "ACTIVE" || member.status === "INACTIVE");
  }, [membersListQuery.data]);

  const summaryMetrics = useMemo(() => {
    const members = membersListQuery.data?.data ?? [];
    const active = members.filter((member) => member.status === "ACTIVE").length;
    const inactive = members.filter((member) => member.status === "INACTIVE").length;
    return [
      {
        label: "Socios activos",
        value: active,
        helper: active ? "Con acceso al club" : "Sin actividad",
      },
      {
        label: "Socios inactivos",
        value: inactive,
        helper: "Contactar para reincorporar",
      },
      {
        label: "Socios elegibles",
        value: eligibleMembers.length,
        helper: "Pueden analizarse en el panel",
      },
    ];
  }, [eligibleMembers.length, membersListQuery.data]);

  const hasEligibleMembers = eligibleMembers.length > 0;

  const highlightMember = useMemo(() => {
    if (!highlightMemberId) return null;
    return eligibleMembers.find((member) => member.id === highlightMemberId) ?? null;
  }, [highlightMemberId, eligibleMembers]);

  const snapshotQuery = useMemberFinancialSnapshot(highlightMemberId ?? undefined, {
    enabled: Boolean(highlightMemberId),
  });

  function closeModal() {
    setModalMode(null);
    setSelectedMember(null);
    setFormError(null);
  }

  async function handleCreate(values: Parameters<typeof createMutation.mutateAsync>[0]) {
    try {
      setFormError(null);
      await createMutation.mutateAsync(values);
      setFeedback({
        type: "success",
        message: "Socio creado correctamente.",
      });
      await membersListQuery.refetch();
      closeModal();
    } catch (error) {
      clientLogger.error("Error al crear socio", error);
      const errorMessage = getErrorMessage(error, "No se pudo crear el socio.");
      setFeedback({
        type: "error",
        message: errorMessage,
      });
      setFormError(errorMessage);
    }
  }

  async function handleUpdate(values: Parameters<typeof updateMutation.mutateAsync>[0]["input"]) {
    try {
      if (!selectedMember) return;
      setFormError(null);
      await updateMutation.mutateAsync({
        memberId: selectedMember.id,
        input: values,
      });
      setFeedback({
        type: "success",
        message: "Socio actualizado correctamente.",
      });
      closeModal();
    } catch (error) {
      clientLogger.error("Error al actualizar socio", error);
      const errorMessage = getErrorMessage(error, "No se pudo actualizar el socio.");
      setFeedback({
        type: "error",
        message: errorMessage,
      });
      setFormError(errorMessage);
    }
  }

  const financialAlertDescription = highlightMember
    ? `Mostrando el estado financiero de ${highlightMember.name ?? "socio sin nombre"}`
    : hasEligibleMembers
      ? "Seleccioná un socio activo/inactivo para revisar su situación económica."
      : "No hay socios activos o inactivos disponibles para consultar.";

  const financialAlertErrorMessage = !hasEligibleMembers
    ? "Situación económica del socio no disponible porque no hay socios activos o inactivos habilitados."
    : highlightMemberId && snapshotQuery.error instanceof Error
      ? snapshotQuery.error.message === "Configuración económica no encontrada."
        ? "No pudimos calcular la situación económica del socio seleccionado. Revisá la configuración económica antes de reintentar."
        : snapshotQuery.error.message
      : null;

  return (
    <>
      <div className="space-y-10">
        <section className="neo-panel overflow-hidden">
          <div className="relative z-10 flex flex-col gap-8 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <span className="neo-chip">Panel administrativo</span>
                <h1 className="text-4xl font-semibold font-[var(--font-space)] tracking-tight">
                  Gestión de socios
                </h1>
                <p className="max-w-2xl text-base-muted">
                  Controlá altas, bajas y estados financieros desde un panel elegante y sin
                  distracciones.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setModalMode("create")}
                >
                  + Nuevo socio
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => membersListQuery.refetch()}
                  disabled={membersListQuery.isFetching}
                >
                  Actualizar datos
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summaryMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/5 bg-white/5 px-5 py-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
                  <p className="text-sm text-base-muted">{metric.helper}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-r from-accent-primary/10 via-transparent to-transparent" />
        </section>

        <section className="space-y-6">
          {feedback && (
            <div
              className={`neo-panel border-l-4 px-5 py-4 text-sm ${
                feedback.type === "success"
                  ? "border-state-active text-state-active"
                  : "border-accent-critical text-accent-critical"
              }`}
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
            </div>
          )}

          <MemberTable
            onCreate={() => setModalMode("create")}
            onEdit={(member) => {
              setSelectedMember(member);
              setModalMode("edit");
            }}
            onInspect={(member) => setHighlightMemberId(member.id)}
          />

          <MemberFinancialAlert
            className="w-full"
            title="Alertas de morosidad"
            description={financialAlertDescription}
            snapshot={snapshotQuery.data}
            isLoading={snapshotQuery.isLoading || snapshotQuery.isRefetching}
            errorMessage={financialAlertErrorMessage}
            actions={
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <select
                  className="select-base md:w-64"
                  disabled={!hasEligibleMembers}
                  value={highlightMemberId ?? ""}
                  onChange={(event) => {
                    setHighlightMemberId(event.target.value ? event.target.value : null);
                  }}
                >
                  <option value="">
                    {hasEligibleMembers
                      ? "Socios (seleccioná uno)"
                      : "Socios (sin registros habilitados)"}
                  </option>
                  {eligibleMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name ?? member.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary whitespace-nowrap"
                  onClick={() => snapshotQuery.refetch()}
                  disabled={!highlightMemberId || snapshotQuery.isFetching || !hasEligibleMembers}
                >
                  Refrescar estado
                </button>
              </div>
            }
          />
        </section>
      </div>

      <Modal
        title={modalMode === "create" ? "Nuevo socio" : "Editar socio"}
        open={modalMode !== null}
        onClose={closeModal}
      >
        {modalMode === "create" && (
          <MemberForm
            mode="create"
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
            serverError={formError}
          />
        )}

        {modalMode === "edit" && selectedMember && (
          <MemberForm
            mode="edit"
            initialData={selectedMember}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
            serverError={formError}
          />
        )}
      </Modal>
    </>
  );
}
