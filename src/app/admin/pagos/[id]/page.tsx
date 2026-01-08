"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMemberPaymentsIndividual } from "@/hooks/use-enrollments";
import { useMemberSummaries } from "@/hooks/use-enrollments";
import { OptimizedScrollArea } from "@/components/ui/optimized-scroll-area";
import { ModalSection } from "@/components/ui/modal-components";

interface PaymentTransaction {
  transactionId: string;
  paidAt: string;
  totalAmount: number;
  duesCount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  dues: Array<{
    dueId: string;
    dueAmount: number;
    dueDate: string;
    dueStatus: string;
  }>;
}

export default function PaymentHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const { data: memberSummaries } = useMemberSummaries();
  const { data: paymentsData, isLoading, error } = useMemberPaymentsIndividual(memberId);

  const memberInfo = useMemo(() => {
    if (!memberSummaries || !memberId) return null;
    
    const member = memberSummaries.find((summary: { member: { id: string } }) => summary.member.id === memberId);
    if (!member) return null;
    
    return {
      name: member.member.name || "Sin nombre",
      documentNumber: member.member.documentNumber,
      email: member.member.email || "Sin email"
    };
  }, [memberSummaries, memberId]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-base-muted">Cargando historial de pagos...</p>
        </div>
      </div>
    );
  }

  if (error || !memberInfo) {
    return (
      <div className="min-h-screen bg-base-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-critical mb-4">Error al cargar los datos del socio</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-primary">
      <div className="page-shell py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="mb-4 text-accent-primary hover:underline text-sm font-medium"
          >
            ← Volver al seguimiento
          </button>
          
          <div className="neo-panel p-6">
            <h1 className="text-3xl font-bold text-base-foreground mb-2">
              Historial Completo de Pagos
            </h1>
            <div className="text-base-muted">
              <p className="text-lg font-medium text-base-foreground">
                {memberInfo.name} · {memberInfo.documentNumber}
              </p>
              <p className="text-sm">{memberInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="neo-panel p-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-base-muted mb-2">
              Total de pagos
            </p>
            <p className="text-3xl font-bold text-base-foreground">
              {paymentsData?.data?.length || 0}
            </p>
          </div>
          <div className="neo-panel p-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-base-muted mb-2">
              Total abonado
            </p>
            <p className="text-3xl font-bold text-accent-primary">
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS"
              }).format(
                paymentsData?.data?.reduce((sum: number, payment: PaymentTransaction) => sum + payment.totalAmount, 0) || 0
              )}
            </p>
          </div>
          <div className="neo-panel p-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-base-muted mb-2">
              Cuotas pagadas
            </p>
            <p className="text-3xl font-bold text-base-foreground">
              {paymentsData?.data?.reduce((sum, payment: PaymentTransaction) => sum + payment.duesCount, 0) || 0}
            </p>
          </div>
        </div>

        {/* Lista de pagos */}
        <div className="neo-panel">
          <ModalSection title="Todos los pagos registrados">
            {!paymentsData?.data || paymentsData.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-base-muted">No hay pagos registrados para este socio.</p>
              </div>
            ) : (
              <OptimizedScrollArea className="max-h-[600px]">
                <div className="space-y-4">
                  {paymentsData.data.map((payment: PaymentTransaction, index: number) => (
                    <motion.div
                      key={payment.transactionId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="rounded-xl border border-base-border/60 bg-gradient-to-r from-base-secondary/20 to-base-secondary/10 p-6"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-3 w-3 rounded-full bg-accent-primary"></div>
                            <p className="font-semibold text-base-foreground text-lg">
                              {new Date(payment.paidAt).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <span className="px-2 py-1 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                              <span className="text-xs font-medium text-accent-primary">
                                #{index + 1}
                              </span>
                            </span>
                          </div>
                          
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase tracking-[0.2em] text-base-muted">
                                Cuotas:
                              </span>
                              <span className="text-sm font-medium text-base-foreground">
                                {payment.duesCount} cuota{payment.duesCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase tracking-[0.2em] text-base-muted">
                                Método:
                              </span>
                              <span className="text-sm font-medium text-base-foreground">
                                {payment.method || "No especificado"}
                              </span>
                            </div>
                            {payment.reference && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs uppercase tracking-[0.2em] text-base-muted">
                                  Referencia:
                                </span>
                                <span className="text-sm font-medium text-base-foreground">
                                  {payment.reference}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <span className="text-xs uppercase tracking-[0.2em] text-base-muted">
                              Período:
                            </span>
                            <span className="text-sm font-medium text-base-foreground ml-2">
                              {new Date(payment.dues[0]?.dueDate).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })} - {new Date(
                                payment.dues[payment.dues.length - 1]?.dueDate
                              ).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          {payment.notes && (
                            <div className="mt-3 pt-3 border-t border-base-border/30">
                              <p className="text-sm text-base-muted">
                                <span className="font-medium">Nota:</span> {payment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.2em] text-base-muted mb-1">
                              Importe total
                            </p>
                            <p className="text-2xl font-bold text-accent-primary">
                              {new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: "ARS"
                              }).format(payment.totalAmount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                            <span className="text-sm font-medium text-accent-primary">
                              {payment.duesCount} cuota{payment.duesCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </OptimizedScrollArea>
            )}
          </ModalSection>
        </div>
      </div>
    </div>
  );
}
