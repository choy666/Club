"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import type { MemberCredentialDTO } from "@/types/enrollment";

interface MemberCredentialCardProps {
  credential?: MemberCredentialDTO | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function MemberCredentialCard({
  credential,
  isLoading,
  error,
  onRefresh,
  title = "Credencial digital",
  subtitle = "QR listo para control de acceso. Se habilita tras activar la inscripción y registrar el primer pago.",
  compact,
}: MemberCredentialCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const code = credential?.credential?.code ?? null;
  const qrPayload = credential?.credential?.qrPayload ?? null;

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      if (!qrPayload) {
        setQrDataUrl(null);
        return;
      }
      const { toDataURL } = await import("qrcode");
      const dataUrl = await toDataURL(qrPayload, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: compact ? 180 : 220,
        color: {
          dark: "#111827",
          light: "#ffffff00",
        },
      });
      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    }
    void generate();
    return () => {
      cancelled = true;
    };
  }, [qrPayload, compact]);

  const status = useMemo(() => {
    if (!credential) return { label: "Sin datos", tone: "neutral" };
    if (!credential.enrollment) return { label: "Sin inscripción", tone: "neutral" };
    if (!credential.isReady) {
      if (credential.enrollment.status !== "ACTIVE") {
        return { label: "Inscripción pendiente", tone: "warning" };
      }
      return { label: "Esperando pago inicial", tone: "warning" };
    }
    return { label: "Credencial activa", tone: "success" };
  }, [credential]);

  function handleCopy() {
    if (!code) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(code);
      setCopyFeedback("Código copiado");
      setTimeout(() => setCopyFeedback(null), 2500);
    } else if (typeof window !== "undefined") {
      window.prompt("Copiá el código manualmente:", code);
    }
  }

  return (
    <div className="neo-panel space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="neo-chip">{status.label}</p>
          <h3 className="text-2xl font-semibold font-[var(--font-space)]">{title}</h3>
          <p className="text-sm text-base-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <motion.button
              type="button"
              className="btn-secondary text-xs uppercase tracking-[0.3em]"
              onClick={() => onRefresh()}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              disabled={isLoading}
            >
              Actualizar
            </motion.button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-base-border/60 bg-base-secondary/30 p-6 text-sm text-base-muted animate-pulse">
          Preparando credencial...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-accent-critical/60 bg-accent-critical/10 p-6 text-sm text-accent-critical">
          {error}
        </div>
      ) : !credential ? (
        <div className="rounded-lg border border-dashed border-base-border/70 p-6 text-sm text-base-muted">
          Aún no hay datos de credencial para este socio.
        </div>
      ) : (
        <div
          className={`grid gap-6 ${compact ? "md:grid-cols-[1fr]" : "md:grid-cols-[1fr_220px]"}`}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-base-border/60 bg-base-secondary/20 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Socio</p>
              <p className="text-lg font-semibold">
                {credential.member.name ?? credential.member.documentNumber}
              </p>
              <p className="text-sm text-base-muted">{credential.member.email}</p>
            </div>

            <div className="rounded-xl border border-base-border/60 bg-base-secondary/20 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Inscripción</p>
              {credential.enrollment ? (
                <div className="mt-2 space-y-1 text-sm text-base-muted">
                  <p>
                    Plan:{" "}
                    <span className="font-semibold">{credential.enrollment.planName ?? "—"}</span>
                  </p>
                  <p>
                    Monto mensual:{" "}
                    <span className="font-semibold">
                      ${credential.enrollment.monthlyAmount.toLocaleString("es-AR")}
                    </span>
                  </p>
                  <p>
                    Estado: <span className="font-semibold">{credential.enrollment.status}</span>
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-base-muted">
                  Todavía no tiene una inscripción asociada.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-base-border/60 bg-base-secondary/30 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Código</p>
              {code ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <code className="rounded bg-base-primary/10 px-2 py-1 text-sm font-mono tracking-widest">
                    {code}
                  </code>
                  <button
                    type="button"
                    className="text-xs text-accent-primary underline-offset-2 hover:underline"
                    onClick={handleCopy}
                  >
                    Copiar
                  </button>
                  {copyFeedback && (
                    <span className="text-xs uppercase tracking-widest text-state-active">
                      {copyFeedback}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-base-muted">
                  Activá la inscripción y registrá el primer pago para generar el código único.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-base-border/60 bg-white/5 px-4 py-6 text-center">
            {qrDataUrl ? (
              <>
                <Image
                  src={qrDataUrl}
                  alt="QR credencial"
                  width={192}
                  height={192}
                  className="h-48 w-48 rounded-lg border border-white/20 bg-white/80 p-3 shadow-lg"
                  unoptimized
                />
                <p className="text-xs text-base-muted">
                  Mostrá este QR en el control de ingreso. Es único e intransferible.
                </p>
              </>
            ) : (
              <div className="text-sm text-base-muted">
                {credential.isReady
                  ? "Generando QR..."
                  : "QR disponible una vez que la credencial esté activa."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
