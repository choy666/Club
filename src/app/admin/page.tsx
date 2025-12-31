"use client";

import Link from "next/link";
import { useState } from "react";

import { MemberTable } from "@/components/members/member-table";
import { Modal } from "@/components/ui/modal";
import { MemberForm } from "@/components/members/member-form";
import type { MemberDTO } from "@/types/member";
import { useCreateMember, useUpdateMember } from "@/hooks/use-members";

type Feedback = {
  type: "success" | "error";
  message: string;
};

export default function AdminMembersPage() {
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember();

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
      console.error(error);
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
      console.error(error);
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

        <MemberTable
          onCreate={() => setModalMode("create")}
          onEdit={(member) => {
            setSelectedMember(member);
            setModalMode("edit");
          }}
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
