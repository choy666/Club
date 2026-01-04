"use client";

import { useMemo, useCallback } from "react";

import { useMembersList, useDeleteMember } from "@/hooks/use-members";
import { useMemberFiltersStore } from "@/store/members-filters-store";
import { StatusBadge } from "./status-badge";
import { MemberFilters } from "./member-filters";
import type { MemberDTO } from "@/types/member";

interface MemberTableProps {
  onCreate: () => void;
  onEdit: (member: MemberDTO) => void;
  onInspect?: (member: MemberDTO) => void;
}

export function MemberTable({ onCreate, onEdit, onInspect }: MemberTableProps) {
  const filters = useMemberFiltersStore();
  const { data, isLoading, error } = useMembersList();
  const deleteMutation = useDeleteMember();

  const hasData = Boolean(data?.data?.length);

  const handleDelete = useCallback(
    (memberId: string) => {
      const confirmed = window.confirm(
        "¿Seguro que deseas eliminar este socio? Esta acción no se puede deshacer."
      );
      if (!confirmed) return;
      deleteMutation.mutate(memberId);
    },
    [deleteMutation]
  );

  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <tbody>
          {Array.from({ length: 4 }).map((_, index) => (
            <tr key={index} className="border-b border-base-border/60">
              <td colSpan={6} className="py-6 animate-pulse text-base-muted">
                Cargando socios...
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
              Ocurrió un error al cargar los socios.
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
              No se encontraron socios con los filtros actuales.
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {data?.data.map((member) => (
          <tr
            key={member.id}
            className="border-b border-base-border/60 hover:bg-base-secondary/40 transition-colors"
          >
            <td className="py-4">
              <div className="flex flex-col">
                <span className="font-semibold">{member.name ?? "Sin nombre"}</span>
                <span className="text-sm text-base-muted">{member.email}</span>
              </div>
            </td>
            <td className="py-4">{member.documentNumber}</td>
            <td className="py-4">{member.phone ?? "-"}</td>
            <td className="py-4">
              <StatusBadge status={member.status} />
            </td>
            <td className="py-4 text-base-muted text-sm">
              {new Date(member.updatedAt).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </td>
            <td className="py-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-sm text-accent-primary hover:underline"
                  onClick={() => onEdit(member)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="text-sm text-accent-critical hover:underline"
                  onClick={() => handleDelete(member.id)}
                  disabled={deleteMutation.isPending}
                >
                  Eliminar
                </button>
                {onInspect && (
                  <button
                    type="button"
                    className="text-sm text-state-active hover:underline"
                    onClick={() => onInspect(member)}
                  >
                    Ver estado
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    );
  }, [data, error, hasData, isLoading, deleteMutation.isPending, onEdit, onInspect, handleDelete]);

  const mobileContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`member-mobile-skeleton-${index}`}
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
          Ocurrió un error al cargar los socios.
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="rounded-2xl border border-base-border/60 bg-base-secondary/30 p-4 text-center text-base-muted">
          No se encontraron socios con los filtros actuales.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data?.data.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-base-border/70 bg-base-secondary/20 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-base-muted">Socio</p>
                <p className="text-lg font-semibold">{member.name ?? "Sin nombre"}</p>
                <p className="text-sm text-base-muted">{member.email}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-base-muted">
                <span className="rounded-full border border-base-border/80 px-2 py-0.5 text-xs uppercase tracking-widest">
                  {member.documentNumber}
                </span>
                <span>{member.phone ?? "Sin teléfono"}</span>
              </div>
              <div className="flex flex-col gap-2">
                <StatusBadge status={member.status} />
                <span className="text-xs text-base-muted">
                  Actualizado{" "}
                  {new Date(member.updatedAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 pt-2 text-sm">
                <button
                  type="button"
                  className="text-accent-primary underline-offset-2 hover:underline"
                  onClick={() => onEdit(member)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="text-accent-critical underline-offset-2 hover:underline disabled:opacity-50"
                  onClick={() => handleDelete(member.id)}
                  disabled={deleteMutation.isPending}
                >
                  Eliminar
                </button>
                {onInspect && (
                  <button
                    type="button"
                    className="text-state-active underline-offset-2 hover:underline"
                    onClick={() => onInspect(member)}
                  >
                    Ver estado
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [data, error, hasData, isLoading, deleteMutation.isPending, onEdit, onInspect, handleDelete]);

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-base-muted">Base activa</p>
          <h2 className="text-2xl font-semibold font-[var(--font-space)]">Gestión de socios</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary text-xs uppercase tracking-[0.3em]"
            onClick={() => filters.setPage(1)}
          >
            Reset paginación
          </button>
          <button type="button" className="btn-primary" onClick={onCreate}>
            + Nuevo socio
          </button>
        </div>
      </div>

      <MemberFilters />

      <div className="neo-table overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[720px] text-left text-sm text-base-muted">
            <thead className="bg-base-secondary/60">
              <tr>
                <th className="px-6 py-4 font-semibold text-base-muted uppercase text-xs tracking-widest">
                  Socio
                </th>
                <th className="px-6 py-4 font-semibold text-base-muted uppercase text-xs tracking-widest">
                  Documento
                </th>
                <th className="px-6 py-4 font-semibold text-base-muted uppercase text-xs tracking-widest">
                  Teléfono
                </th>
                <th className="px-6 py-4 font-semibold text-base-muted uppercase text-xs tracking-widest">
                  Estado
                </th>
                <th className="px-6 py-4 font-semibold text-base-muted uppercase text-xs tracking-widest">
                  Actualizado
                </th>
                <th className="px-6 py-4 font-semibold text-base-muted uppercase text-xs tracking-widest">
                  Acciones
                </th>
              </tr>
            </thead>
            {tableContent}
          </table>
        </div>
        <div className="block md:hidden">{mobileContent}</div>
        {hasData && (
          <div className="flex flex-col gap-3 border-t border-base-border px-6 py-4 text-sm text-base-muted md:flex-row md:items-center md:justify-between">
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
    </div>
  );
}
