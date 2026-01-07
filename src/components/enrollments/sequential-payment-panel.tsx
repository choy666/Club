"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TRANSFERENCIA" | "MERCADO_PAGO">(
    "EFECTIVO"
  );
  const [paymentNotes, setPaymentNotes] = useState("");
  const payMutation = usePaySequentialDues();

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalDues = memberSummary.dues.length;
    const paidDues = memberSummary.paidCount;
    const pendingDues = memberSummary.pendingCount + memberSummary.overdueCount;
    const dueAmount = memberSummary.dues[0]?.amount || 0;

    // Máximo de cuotas que se pueden pagar (mínimo entre pendientes y 60)
    const maxPayableDues = Math.min(pendingDues, 60);

    // Meses cubiertos después del pago
    const monthsCoveredAfterPayment = paidDues + numberOfDues;

    // Total a cobrar
    const totalAmount = dueAmount * numberOfDues;

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
      nextDueDateAfterPayment,
    };
  }, [memberSummary, numberOfDues]);

  const handlePay = async () => {
    if (numberOfDues <= 0 || numberOfDues > stats.maxPayableDues) return;

    try {
      const result = await payMutation.mutateAsync({
        memberId,
        numberOfDues,
        paymentMethod,
        paymentNotes: paymentNotes.trim() || undefined,
      });

      if (result.promotedToVitalicio) {
        alert(`¡Felicidades! ${memberName} ha alcanzado el estatus VITALICIO.`);
      }

      onClose();
    } catch (error) {
      console.error("Error al pagar cuotas:", error);
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
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Cantidad de Cuotas</label>
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
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          />
          <p className="text-xs text-base-muted mt-1">
            Máximo disponible: {stats.maxPayableDues} cuotas
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-base-muted">Meses cubiertos después del pago</p>
            <p className="text-xl font-bold">{stats.monthsCoveredAfterPayment}</p>
          </div>
          <div>
            <p className="text-sm text-base-muted">Monto de cuota</p>
            <p className="text-xl font-bold">{formatCurrency(stats.dueAmount)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-accent-primary/30 bg-accent-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-muted">Total a cobrar</p>
              <p className="text-2xl font-bold text-accent-primary">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-base-muted">Por {numberOfDues} cuota(s)</p>
              {stats.nextDueDateAfterPayment && (
                <p className="text-base-muted">
                  Próximo vencimiento: {formatDate(stats.nextDueDateAfterPayment)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Método de pago */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Método de pago</label>
          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as "EFECTIVO" | "TRANSFERENCIA" | "MERCADO_PAGO")
            }
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none"
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia bancaria</option>
            <option value="MERCADO_PAGO">Mercado Pago</option>
          </select>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <textarea
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="Notas sobre el pago..."
            rows={3}
            className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 focus:border-accent-primary focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 btn-secondary"
          disabled={payMutation.isPending}
        >
          Cancelar
        </button>
        <motion.button
          type="button"
          onClick={handlePay}
          className="flex-1 btn-primary"
          disabled={
            numberOfDues <= 0 || numberOfDues > stats.maxPayableDues || payMutation.isPending
          }
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          {payMutation.isPending ? "Procesando..." : `Pagar ${formatCurrency(stats.totalAmount)}`}
        </motion.button>
      </div>
    </div>
  );
}
