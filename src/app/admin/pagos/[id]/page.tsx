"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMemberPaymentsIndividual } from "@/hooks/use-enrollments";
import { useMemberSummaries } from "@/hooks/use-enrollments";
import { fromLocalDateOnly, addMonthsLocal } from "@/lib/utils/date-utils";

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

  const { data: memberSummaries, isLoading: isLoadingMembers } = useMemberSummaries();
  const { data: paymentsData, isLoading, error } = useMemberPaymentsIndividual(memberId);

  const memberInfo = useMemo(() => {
    if (!memberSummaries || !memberId) return null;

    const member = memberSummaries.find(
      (summary: { member: { id: string } }) => summary.member.id === memberId
    );
    if (!member) return null;

    return {
      name: member.member.name || "Sin nombre",
      documentNumber: member.member.documentNumber,
      email: member.member.email || "Sin email",
    };
  }, [memberSummaries, memberId]);

  const handleBack = () => {
    router.back();
  };

  // Mostrar carga mientras se cargan los datos del miembro o los pagos
  if (isLoading || isLoadingMembers) {
    return (
      <div className="min-h-screen bg-base-primary flex items-center justify-center">
        <div className="text-center">
          <div className="modal-loading-spinner mx-auto mb-4"></div>
          <p className="text-base-muted">Cargando historial de pagos...</p>
        </div>
      </div>
    );
  }

  if (error || !memberInfo) {
    return (
      <div className="min-h-screen bg-base-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-critical mb-4">
            {error ? "Error al cargar los pagos del socio" : "No se encontró información del socio"}
          </p>
          <button onClick={handleBack} className="btn-primary">
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Manejo seguro de datos de pagos
  const payments = paymentsData?.data || [];

  return (
    <div className="min-h-screen bg-base-primary rounded-lg">
      <div className="page-shell py-8 px-4">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={handleBack}
            className="mb-6 text-accent-primary hover:text-accent-hover text-sm font-medium transition-colors"
          >
            ← Volver
          </button>

          <div className="neo-panel p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-base-foreground mb-4">
              Historial de Pagos
            </h1>
            <div className="text-base-muted space-y-2">
              <p className="text-base font-medium text-base-foreground">
                {memberInfo.name} · {memberInfo.documentNumber}
              </p>
              <p className="text-sm">{memberInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-6 sm:grid-cols-3 mb-10">
          <div className="neo-panel p-8 text-center">
            <p className="text-sm font-medium text-base-muted mb-3">Pagos</p>
            <p className="text-2xl font-bold text-base-foreground">{payments.length || 0}</p>
          </div>
          <div className="neo-panel p-8 text-center">
            <p className="text-sm font-medium text-base-muted mb-3">Total abonado</p>
            <p className="text-2xl font-bold text-accent-primary">
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
              }).format(
                payments.reduce(
                  (sum: number, payment: PaymentTransaction) => sum + payment.totalAmount,
                  0
                ) || 0
              )}
            </p>
          </div>
          <div className="neo-panel p-8 text-center">
            <p className="text-sm font-medium text-base-muted mb-3">Cuotas pagadas</p>
            <p className="text-2xl font-bold text-base-foreground">
              {payments.reduce((sum, payment: PaymentTransaction) => sum + payment.duesCount, 0) ||
                0}
            </p>
          </div>
        </div>

        {/* Lista de pagos */}
        <div className="neo-panel">
          <div className="p-8 border-b border-base-border">
            <h2 className="text-lg font-semibold text-base-foreground">Pagos registrados</h2>
          </div>
          {!payments || payments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-base-muted">No hay pagos registrados para este socio.</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto optimized-scroll-area">
              <div className="divide-y divide-base-division">
                {payments.map((payment: PaymentTransaction, index: number) => (
                  <div
                    key={payment.transactionId}
                    className="p-8 hover:bg-base-secondary/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-2 w-2 rounded-full bg-state-active"></div>
                          <p className="font-semibold text-base-foreground">
                            {new Date(payment.paidAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <span className="px-3 py-1 rounded bg-accent-primary/10 border border-accent-primary/20 text-xs font-medium text-accent-primary">
                            #{index + 1}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <span className="text-xs text-base-muted">Cuotas: </span>
                            <span className="text-sm font-medium text-base-foreground">
                              {payment.duesCount} cuota{payment.duesCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-base-muted">Período: </span>
                            <span className="text-sm font-medium text-base-foreground">
                              {(() => {
                                console.log("🔍 [PAGE DEBUG] Procesando pago:", payment.transactionId);
                                console.log("🔍 [PAGE DEBUG] Payment dues:", payment.dues);
                                
                                // El memberId ya está disponible en la URL de la página
                                console.log("🔍 [PAGE DEBUG] MemberId de URL:", memberId);
                                
                                if (!memberId) {
                                  console.log("❌ [PAGE DEBUG] No hay memberId en URL");
                                  return "N/A";
                                }
                                
                                const member = memberSummaries?.find(m => m.member.id === memberId);
                                console.log("🔍 [PAGE DEBUG] Member encontrado:", !!member);
                                console.log("🔍 [PAGE DEBUG] Member enrollment:", member?.enrollment);
                                
                                if (!member?.enrollment?.startDate) {
                                  console.log("❌ [PAGE DEBUG] No hay enrollment.startDate");
                                  return "N/A";
                                }

                                // Usar la misma lógica que la modal de pago para calcular cobertura
                                const enrollmentDate = fromLocalDateOnly(member.enrollment.startDate);
                                console.log("🔍 [PAGE DEBUG] EnrollmentDate:", enrollmentDate);
                                
                                // Para calcular la cobertura correcta, necesitamos saber cuántas cuotas tenía
                                // el socio ANTES de este pago específico
                                const allPayments = payments || [];
                                console.log("🔍 [PAGE DEBUG] AllPayments:", allPayments.length);
                                
                                // Encontrar este pago en la lista (ya está ordenada por fecha)
                                const currentPaymentIndex = allPayments.findIndex((p) => p.transactionId === payment.transactionId);
                                console.log("🔍 [PAGE DEBUG] CurrentPaymentIndex:", currentPaymentIndex);
                                
                                if (currentPaymentIndex === -1) {
                                  console.log("❌ [PAGE DEBUG] No se encontró el pago en la lista");
                                  return "N/A";
                                }
                                
                                // Calcular cuántas cuotas tenía el socio ANTES de este pago
                                let paidDuesBeforeThisPayment = 0;
                                for (let i = 0; i < currentPaymentIndex; i++) {
                                  paidDuesBeforeThisPayment += allPayments[i].duesCount;
                                }
                                
                                // La cobertura total después de este pago es: cuotas antes + cuotas de este pago
                                const totalMonthsAfterPayment = paidDuesBeforeThisPayment + payment.duesCount;
                                console.log("🔍 [PAGE DEBUG] PaidDuesBefore:", paidDuesBeforeThisPayment);
                                console.log("🔍 [PAGE DEBUG] CurrentDues:", payment.duesCount);
                                console.log("🔍 [PAGE DEBUG] TotalMonths:", totalMonthsAfterPayment);
                                
                                // Calcular fecha de cobertura hasta
                                const coverageUntilDate = addMonthsLocal(enrollmentDate, totalMonthsAfterPayment);
                                console.log("🔍 [PAGE DEBUG] CoverageUntilDate:", coverageUntilDate);
                                
                                // Formatear las fechas
                                const formatDate = (date: Date) => {
                                  return date.toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  });
                                };

                                const coverageFrom = formatDate(enrollmentDate);
                                const coverageTo = formatDate(coverageUntilDate);
                                console.log("🔍 [PAGE DEBUG] Resultado:", `${coverageFrom} - ${coverageTo}`);

                                return `${coverageFrom} - ${coverageTo}`;
                              })()}
                            </span>
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="mt-4 pt-4 border-t border-base-border">
                            <p className="text-sm text-base-muted">
                              <span className="font-medium">Nota:</span> {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-base-muted mb-2">Importe total</p>
                          <p className="text-xl font-bold text-accent-primary">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            }).format(payment.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
