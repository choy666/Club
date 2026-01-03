"use client";

import Link from "next/link";
import { useMemberProfile, useMyFinancialSnapshot } from "@/hooks/use-members";
import { MemberProfileCard } from "@/components/members/member-profile-card";
import { MemberFinancialAlert } from "@/components/members/member-financial-alert";

export default function SocioPage() {
  const { data, isLoading, error } = useMemberProfile();
  const snapshotQuery = useMyFinancialSnapshot({
    enabled: Boolean(data),
  });

  return (
    <div className="min-h-screen bg-base-primary px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
            Portal del socio
          </p>
          <h1 className="text-4xl font-semibold font-[var(--font-space)]">
            Tus datos y estado actual
          </h1>
          <p className="text-base-muted max-w-2xl">
            Revisa tu información personal, estado de afiliación y notas
            asociadas a tu perfil. Si encontrás algún dato incorrecto,
            comunicate con administración.
          </p>
        </header>

        {isLoading && (
          <div className="glass-card border border-base-border/60 px-6 py-8 text-base-muted animate-pulse">
            Cargando tu perfil...
          </div>
        )}

        {error && (
          <div className="glass-card border border-accent-critical px-6 py-8 text-accent-critical">
            No pudimos obtener tus datos. Intenta refrescar la página o vuelve a
            iniciar sesión.
          </div>
        )}

        {data && (
          <>
            <MemberFinancialAlert
              title="Estado de tus pagos"
              description="Esto define tu acceso al club y las comunicaciones activas."
              snapshot={snapshotQuery.data}
              isLoading={snapshotQuery.isLoading || snapshotQuery.isRefetching}
              errorMessage={
                snapshotQuery.error instanceof Error
                  ? snapshotQuery.error.message
                  : null
              }
              actions={
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => snapshotQuery.refetch()}
                  disabled={snapshotQuery.isFetching}
                >
                  Actualizar estado
                </button>
              }
            />
            <MemberProfileCard member={data} snapshot={snapshotQuery.data} />
          </>
        )}

        <div className="flex flex-wrap gap-4">
          <Link href="/admin" className="btn-secondary">
            Volver al panel admin
          </Link>
          <button
            className="btn-primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Actualizar datos
          </button>
        </div>
      </div>
    </div>
  );
}
