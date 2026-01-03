"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { clientLogger } from "@/lib/client-logger";
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
  const [highlightMemberId, setHighlightMemberId] = useState<string | null>(
    null,
  );

  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember();
  const membersListQuery = useMembersList();

  const fallbackMemberId = useMemo(() => {
    return membersListQuery.data?.data?.[0]?.id ?? null;
  }, [membersListQuery.data]);

  const activeMemberId = highlightMemberId ?? fallbackMemberId;

  const highlightMember = useMemo(() => {
    if (!activeMemberId) return null;
    return (
      membersListQuery.data?.data.find(
        (member) => member.id === activeMemberId,
      ) ?? null
    );
  }, [activeMemberId, membersListQuery.data]);

  const snapshotQuery = useMemberFinancialSnapshot(
    activeMemberId ?? undefined,
    {
      enabled: Boolean(activeMemberId),
    },
  );

  function closeModal() {
    setModalMode(null);
    setSelectedMember(null);
  }

  async function handleCreate(
    values: Parameters<typeof createMutation.mutateAsync>[0],
  ) {
    try {
      await createMutation.mutateAsync(values);
      setFeedback({
        type: "success",
        message: "Socio creado correctamente.",
      });
      closeModal();
    } catch (error) {
      clientLogger.error("Error al crear socio", error);
      setFeedback({
        type: "error",
        message: "No se pudo crear el socio.",
      });
    }
  }

  async function handleUpdate(
    values: Parameters<typeof updateMutation.mutateAsync>[0]["input"],
  ) {
    try {
      if (!selectedMember) return;
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
      setFeedback({
        type: "error",
        message: "No se pudo actualizar el socio.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-base-primary px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-base-muted">
              Panel administrativo
            </p>
            <h1 className="text-3xl font-semibold font-[var(--font-space)]">
              Gestión de socios
            </h1>
            <p className="mt-2 text-base text-base-muted">
              Administrá el padrón de socios y accedé al módulo de inscripciones
              y cuotas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/inscripciones" className="btn-secondary">
              Ir a Inscripciones y cuotas →
            </Link>
            <Link href="/admin/reportes" className="btn-primary">
              Ver reportes ejecutivos →
            </Link>
          </div>
        </header>
        <MemberFinancialAlert
          title="Alertas de morosidad"
          description={
            highlightMember
              ? `Mostrando el estado financiero de ${highlightMember.name ?? "socio sin nombre"}`
              : "Seleccioná un socio para revisar pagos pendientes o vencidos."
          }
          snapshot={snapshotQuery.data}
          isLoading={snapshotQuery.isLoading || snapshotQuery.isRefetching}
          errorMessage={
            snapshotQuery.error instanceof Error
              ? snapshotQuery.error.message
              : null
          }
          actions={
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <select
                className="rounded-md border border-base-border bg-base-primary px-3 py-2 text-sm"
                value={highlightMemberId ?? ""}
                onChange={(event) => {
                  setHighlightMemberId(
                    event.target.value ? event.target.value : null,
                  );
                }}
              >
                {!highlightMemberId && (
                  <option value="">Seleccioná un socio</option>
                )}
                {membersListQuery.data?.data.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name ?? member.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary whitespace-nowrap"
                onClick={() => snapshotQuery.refetch()}
                disabled={!activeMemberId || snapshotQuery.isFetching}
              >
                Refrescar estado
              </button>
            </div>
          }
        />
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

        <MemberTable
          onCreate={() => setModalMode("create")}
          onEdit={(member) => {
            setSelectedMember(member);
            setModalMode("edit");
            setHighlightMemberId(member.id);
          }}
          onInspect={(member) => setHighlightMemberId(member.id)}
        />
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
          />
        )}

        {modalMode === "edit" && selectedMember && (
          <MemberForm
            mode="edit"
            initialData={selectedMember}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
