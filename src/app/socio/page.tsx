"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { useMemberProfile, useMyFinancialSnapshot, useMyCredential } from "@/hooks/use-members";
import { MemberProfileCard } from "@/components/members/member-profile-card";
import { MemberFinancialAlert } from "@/components/members/member-financial-alert";
import { MemberCredentialCard } from "@/components/credentials/member-credential-card";

export default function SocioPage() {
  const { data, isLoading, error } = useMemberProfile();
  const snapshotQuery = useMyFinancialSnapshot({
    enabled: Boolean(data),
  });
  const credentialQuery = useMyCredential({
    enabled: Boolean(data),
  });

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(248,113,113,0.18),transparent_50%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.15),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.05)_0%,transparent_55%)] opacity-80" />

      <div className="relative mx-auto flex max-w-4xl flex-col gap-6">
        <motion.header
          className="neo-panel flex flex-col gap-3 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="neo-chip">Portal del socio</p>
          <h1 className="text-4xl font-semibold font-[var(--font-space)]">
            Tus datos y estado actual
          </h1>
          <p className="text-base-muted max-w-2xl">
            Revisá tu información personal, estado de afiliación y notas asociadas a tu perfil. Si
            encontrás algún dato incorrecto, comunicate con administración.
          </p>
        </motion.header>

        {isLoading && (
          <div className="neo-panel border border-white/10 px-6 py-8 text-base-muted animate-pulse">
            Cargando tu perfil...
          </div>
        )}

        {error && (
          <div className="neo-panel border border-accent-critical/60 bg-accent-critical/10 px-6 py-8 text-accent-critical">
            No pudimos obtener tus datos. Intentá refrescar la página o volver a iniciar sesión.
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
                snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null
              }
              actions={
                <motion.button
                  type="button"
                  className="btn-secondary"
                  onClick={() => snapshotQuery.refetch()}
                  disabled={snapshotQuery.isFetching}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Actualizar estado
                </motion.button>
              }
            />
            <MemberProfileCard member={data} snapshot={snapshotQuery.data} />
            <MemberCredentialCard
              credential={credentialQuery.data}
              isLoading={credentialQuery.isLoading || credentialQuery.isRefetching}
              error={credentialQuery.error instanceof Error ? credentialQuery.error.message : null}
              title="Tu credencial de socio"
              subtitle="Necesitás una inscripción activa y el primer pago registrado. El código se actualiza de forma automática."
            />
          </>
        )}

        <div className="flex flex-wrap gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Link href="/admin" className="btn-secondary">
              Volver al panel admin
            </Link>
          </motion.div>
          <motion.button
            className="btn-primary"
            type="button"
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            Actualizar datos
          </motion.button>
        </div>
      </div>
    </div>
  );
}
