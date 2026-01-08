"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { usePaySequentialDues } from "@/hooks/use-enrollments";
import type { MemberSummary } from "@/components/enrollments/due-table";

interface SequentialPaymentPanelProps {
  memberId: string;
  memberName: string;
  memberSummary: MemberSummary;
  onClose: () => void;
}

export function SequentialPaymentPanel({
  memberId,
  memberName,
  memberSummary,
  onClose,
}: SequentialPaymentPanelProps) {
  const [numberOfDues, setNumberOfDues] = useState(1);
  const [dueAmount, setDueAmount] = useState(memberSummary.dues[0]?.amount || 200);
  const payMutation = usePaySequentialDues();
  const queryClient = useQueryClient();

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalDues = memberSummary.dues.length;
    const paidDues = memberSummary.paidCount;
    const pendingDues = memberSummary.pendingCount + memberSummary.overdueCount;

    // Máximo de cuotas que se pueden pagar (mínimo entre pendientes y 60)
    const maxPayableDues = Math.min(pendingDues, 60);

    // Meses cubiertos después del pago (mes de inscripción + cuotas pagadas + cuotas a pagar)
    const monthsCoveredAfterPayment = paidDues + numberOfDues + 1;

    // Total a cobrar usando el monto definido en la modal
    const totalAmount = dueAmount * numberOfDues;

    // Fecha de cobertura desde (fecha de inscripción)
    const coverageFromDate = memberSummary.enrollment?.startDate || null;

    // Fecha de cobertura hasta (fecha de inscripción + cuotas pagadas + cuotas a pagar + 1 mes de inscripción)
    const coverageUntilDate = coverageFromDate
      ? (() => {
          const enrollmentDate = new Date(coverageFromDate);
          // Sumar cuotas pagadas + cuotas seleccionadas + 1 mes (el mes de inscripción)
          // Ejemplo: 0 pagadas + 1 a pagar + 1 inscripción = 2 meses totales
          enrollmentDate.setMonth(enrollmentDate.getMonth() + paidDues + numberOfDues + 1);
          return enrollmentDate.toISOString();
        })()
      : null;

    // Fecha del próximo vencimiento después del pago
    const nextDueDateAfterPayment =
      monthsCoveredAfterPayment < totalDues
        ? memberSummary.dues[monthsCoveredAfterPayment]?.dueDate
        : null;

    return {
      totalDues,
      paidDues,
      pendingDues,
      dueAmount,
      maxPayableDues,
      monthsCoveredAfterPayment,
      totalAmount,
      coverageFromDate,
      coverageUntilDate,
      nextDueDateAfterPayment,
    };
  }, [memberSummary, numberOfDues, dueAmount]);

  const handlePay = async () => {
    if (numberOfDues <= 0 || numberOfDues > stats.maxPayableDues) return;

    console.log("💳 [PAGO] Iniciando proceso de pago");
    console.log("📊 [PAGO] memberId:", memberId);
    console.log("📊 [PAGO] numberOfDues:", numberOfDues);
    console.log("📊 [PAGO] dueAmount:", dueAmount);
    console.log("📊 [PAGO] totalAmount:", numberOfDues * dueAmount);

    try {
      console.log("🔄 [PAGO] Enviando mutación de pago...");
      const result = await payMutation.mutateAsync({
        memberId,
        numberOfDues,
        dueAmount,
      });

      console.log("✅ [PAGO] Pago completado exitosamente");
      console.log("📊 [PAGO] Resultado del pago:", result);
      console.log("📊 [PAGO] paidDues:", result.paidDues);
      console.log("📊 [PAGO] totalAmount:", result.totalAmount);
      console.log("📊 [PAGO] promotedToVitalicio:", result.promotedToVitalicio);

      if (result.promotedToVitalicio) {
        alert(`¡Felicidades! ${memberName} ha alcanzado el estatus VITALICIO.`);
      }

      // Invalidar queries para recargar datos actualizados
      console.log("🔄 [PAGO] Invalidando queries...");
      queryClient.invalidateQueries({ queryKey: ["dues-summary"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["member-payments"] });

      console.log("✅ [PAGO] Proceso de pago finalizado");
      onClose();
    } catch (error) {
      console.error("❌ [PAGO] Error al pagar cuotas:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="neo-panel space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pagar Cuotas</h3>
          <p className="text-sm text-base-muted">{memberName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-base-muted hover:text-base-foreground"
        >
          ✕
        </button>
      </div>

      {/* Resumen de estado actual */}
      <div className="rounded-lg border border-base-border/60 bg-base-secondary/20 p-4">
        <h4 className="text-sm font-medium mb-3">Estado Actual</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-base-muted">Cuotas pagadas/total</p>
            <p className="text-xl font-bold text-state-active">
              {stats.paidDues} / {stats.totalDues}
            </p>
          </div>
          <div>
            <p className="text-base-muted">Cuotas pendientes</p>
            <p className="text-xl font-bold text-amber-500">{stats.pendingDues}</p>
          </div>
        </div>
      </div>

      {/* Formulario de pago */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
              Cantidad de Cuotas
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={stats.maxPayableDues}
                value={numberOfDues}
                onChange={(e) =>
                  setNumberOfDues(
                    Math.max(1, Math.min(stats.maxPayableDues, parseInt(e.target.value) || 1))
                  )
                }
                className="w-full rounded-lg border border-base-border bg-transparent px-4 py-3 pr-12 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-base-muted">
                / {stats.maxPayableDues}
              </span>
            </div>
            <p className="text-xs text-base-muted flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Máximo disponible: {stats.maxPayableDues} cuotas
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
              Monto por cuota
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-base-muted font-medium">
                $
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={dueAmount}
                onChange={(e) => setDueAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-base-border bg-transparent pl-8 pr-4 py-3 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all"
              />
            </div>
            <p className="text-xs text-base-muted flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              Define el monto a cobrar por cada cuota
            </p>
          </div>
        </div>

        {/* Sección de Cobertura Mejorada */}
        <div className="rounded-xl border border-base-border/60 bg-gradient-to-r from-blue-50/10 to-purple-50/10 p-5">
          <h4 className="text-sm font-semibold text-base-muted mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-primary"></span>
            Periodo de Cobertura
          </h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs text-base-muted font-medium uppercase tracking-wider">
                Fecha de inscripción
              </p>
              <p className="text-lg font-bold text-base-foreground">
                {stats.coverageFromDate
                  ? formatDate(stats.coverageFromDate)
                  : memberSummary.enrollment?.startDate
                    ? formatDate(memberSummary.enrollment.startDate)
                    : "Sin fecha de inscripción"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-base-muted font-medium uppercase tracking-wider">
                Cobertura hasta
              </p>
              <p className="text-lg font-bold text-accent-primary">
                {stats.coverageUntilDate ? formatDate(stats.coverageUntilDate) : "N/A"}
              </p>
            </div>
          </div>
          {stats.coverageFromDate && stats.coverageUntilDate && (
            <div className="mt-4 pt-4 border-t border-base-border/40">
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-muted">Meses de cobertura total:</span>
                <span className="font-semibold text-base-foreground">
                  {stats.monthsCoveredAfterPayment} meses
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Resumen del Pago */}
        <div className="rounded-lg border border-accent-primary/30 bg-accent-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-muted">Total a cobrar</p>
              <p className="text-2xl font-bold text-accent-primary">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 pt-2">
        <motion.button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 rounded-lg border border-base-border bg-base-secondary/50 text-base-foreground font-medium hover:bg-base-secondary/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={payMutation.isPending}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
        >
          Cancelar
        </motion.button>
        <motion.button
          type="button"
          onClick={handlePay}
          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-accent-primary to-accent-primary/90 text-white font-medium shadow-lg shadow-accent-primary/25 hover:shadow-xl hover:shadow-accent-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg relative overflow-hidden"
          disabled={
            numberOfDues <= 0 || numberOfDues > stats.maxPayableDues || payMutation.isPending
          }
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          {payMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Procesando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              Pagar {formatCurrency(stats.totalAmount)}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
