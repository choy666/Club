"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { usePaySequentialDues } from "@/hooks/use-enrollments";
import { fromLocalDateOnly, addMonthsLocal, toLocalDateOnly } from "@/lib/utils/date-utils";
import type { MemberSummary } from "@/components/enrollments/due-table";
import { formatCurrency } from "@/lib/number-format";

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

    // Máximo de cuotas que se pueden pagar (basado en 360 cuotas totales)
    const maxPayableDues = Math.min(pendingDues, 360 - paidDues);

    // Meses cubiertos después del pago (mes de inscripción + cuotas pagadas + cuotas a pagar - 1)
    // La primera cuota cubre el mes de inscripción, por lo que no se suma el +1
    const monthsCoveredAfterPayment = paidDues + numberOfDues;

    // Total a cobrar usando el monto definido en la modal
    const totalAmount = dueAmount * numberOfDues;

    // Fecha de cobertura desde (fecha de inscripción)
    const coverageFromDate = memberSummary.enrollment?.startDate || null;

    // Fecha de cobertura hasta (fecha de inscripción + cuotas pagadas + cuotas a pagar)
    // Para N cuotas, la cobertura es N meses completos desde la fecha de inscripción
    // Ejemplo: 0 pagadas + 1 a pagar = 1 mes total → fecha de inscripción + 1 mes
    // Ejemplo: 0 pagadas + 2 a pagar = 2 meses total → fecha de inscripción + 2 meses
    const coverageUntilDate = coverageFromDate
      ? (() => {
          const enrollmentDate = fromLocalDateOnly(coverageFromDate);
          // La cobertura total es: cuotas pagadas + cuotas a pagar
          const totalMonths = paidDues + numberOfDues;
          const coverageDate = addMonthsLocal(enrollmentDate, totalMonths);
          return toLocalDateOnly(coverageDate);
        })()
      : null;

    // Fecha del próximo vencimiento después del pago
    // El índice debe ser monthsCoveredAfterPayment - 1 porque el array es 0-based
    const nextDueDateAfterPayment =
      monthsCoveredAfterPayment < totalDues
        ? memberSummary.dues[monthsCoveredAfterPayment - 1]?.dueDate
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });

      console.log("✅ [PAGO] Proceso de pago finalizado");
      onClose();
    } catch (error) {
      console.error("❌ [PAGO] Error al pagar cuotas:", error);

      // Mostrar mensaje de error específico al usuario
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error desconocido al procesar el pago. Por favor, intente nuevamente.");
      }
    }
  };

  const formatDate = (dateString: string) => {
    // Usar utilidad de fecha local para evitar desfasaje de timezone
    const date = fromLocalDateOnly(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="neo-panel space-y-4 max-h-[75vh] overflow-hidden">
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

      {/* Resumen de estado actual - Compacto */}
      <div className="rounded-lg border border-base-border/60 bg-base-secondary/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-base-muted">Pagadas/Total</p>
              <p className="text-lg font-bold text-state-active">
                {stats.paidDues} / {stats.totalDues}
              </p>
            </div>
            <div>
              <p className="text-xs text-base-muted">Pendientes</p>
              <p className="text-lg font-bold text-amber-500">{stats.pendingDues}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-base-muted">Disponibles</p>
            <p className="text-lg font-bold text-accent-primary">{stats.maxPayableDues}</p>
          </div>
        </div>
      </div>

      {/* Formulario de pago - Compacto */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-accent-primary"></span>
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
                className="w-full rounded-lg border border-base-border bg-transparent px-3 py-2 pr-10 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-base-muted">
                / {stats.maxPayableDues}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-accent-primary"></span>
              Monto por cuota
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-base-muted font-medium">
                $
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={dueAmount}
                onChange={(e) => setDueAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-base-border bg-transparent pl-6 pr-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Sección de Cobertura - Compacta */}
        <div className="rounded-lg border border-base-border/60 bg-gradient-to-r from-blue-50/10 to-purple-50/10 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
              <span className="text-xs font-medium text-base-muted uppercase tracking-wider">
                Cobertura
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-base-muted">Total meses</p>
              <p className="text-sm font-bold text-accent-primary">
                {stats.monthsCoveredAfterPayment}
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-base-muted">Desde:</p>
              <p className="font-medium">
                {stats.coverageFromDate
                  ? formatDate(stats.coverageFromDate)
                  : memberSummary.enrollment?.startDate
                    ? formatDate(memberSummary.enrollment.startDate)
                    : "Sin fecha"}
              </p>
            </div>
            <div>
              <p className="text-base-muted">Hasta:</p>
              <p className="font-medium text-accent-primary">
                {stats.coverageUntilDate ? formatDate(stats.coverageUntilDate) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen del Pago - Compacto */}
        <div className="rounded-lg border border-accent-primary/30 bg-accent-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-muted">Total a cobrar</p>
              <p className="text-xl font-bold text-accent-primary">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-base-muted">Cuotas</p>
              <p className="text-lg font-semibold text-accent-primary">{numberOfDues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción - Compactos */}
      <div className="flex gap-2 pt-1">
        <motion.button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 rounded-lg border border-base-border bg-base-secondary/50 text-base-foreground font-medium hover:bg-base-secondary/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          disabled={payMutation.isPending}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
        >
          Cancelar
        </motion.button>
        <motion.button
          type="button"
          onClick={handlePay}
          className="group flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg relative overflow-hidden border border-emerald-400/20 text-sm"
          disabled={
            numberOfDues <= 0 || numberOfDues > stats.maxPayableDues || payMutation.isPending
          }
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

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
                  strokeWidth="2.5"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              <span className="font-bold">Pagar {formatCurrency(stats.totalAmount)}</span>
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
