"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePayMultipleDues } from "@/hooks/use-enrollments";
import type { DueDTO } from "@/types/enrollment";

interface DuePaymentPanelProps {
  memberId: string;
  memberName: string;
  dues: DueDTO[];
  onClose: () => void;
}

export function DuePaymentPanel({ memberId, memberName, dues, onClose }: DuePaymentPanelProps) {
  const [selectedDues, setSelectedDues] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TRANSFERENCIA" | "MERCADO_PAGO">("EFECTIVO");
  const [paymentNotes, setPaymentNotes] = useState("");
  const payMutation = usePayMultipleDues();

  // Filtrar cuotas pendientes
  const pendingDues = dues.filter(due => due.status === "PENDING");
  const totalAmount = selectedDues.reduce((sum, dueId) => {
    const due = pendingDues.find(d => d.id === dueId);
    return sum + (due?.amount || 0);
  }, 0);

  const handleToggleDue = (dueId: string) => {
    setSelectedDues(prev => 
      prev.includes(dueId) 
        ? prev.filter(id => id !== dueId)
        : [...prev, dueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDues.length === pendingDues.length) {
      setSelectedDues([]);
    } else {
      setSelectedDues(pendingDues.map(due => due.id));
    }
  };

  const handlePay = async () => {
    if (selectedDues.length === 0) return;

    try {
      await payMutation.mutateAsync({
        memberId,
        dueIds: selectedDues,
        paymentMethod,
        paymentNotes: paymentNotes.trim() || undefined,
      });

      if (payMutation.data?.promotedToVitalicio) {
        alert(`¡Felicidades! ${memberName} ha alcanzado el estatus VITALICIO.`);
      }

      onClose();
    } catch (error) {
      console.error("Error al pagar cuotas:", error);
    }
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

      {/* Resumen */}
      <div className="rounded-lg border border-base-border/60 bg-base-secondary/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-muted">Cuotas seleccionadas</p>
            <p className="text-2xl font-bold">{selectedDues.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-base-muted">Total a pagar</p>
            <p className="text-2xl font-bold text-accent-primary">
              ${totalAmount.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>

      {/* Selección de cuotas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Cuotas pendientes ({pendingDues.length})</h4>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-accent-primary hover:underline"
          >
            {selectedDues.length === pendingDues.length ? "Deseleccionar todas" : "Seleccionar todas"}
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {pendingDues.map(due => (
            <div
              key={due.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedDues.includes(due.id)
                  ? "border-accent-primary bg-accent-primary/5"
                  : "border-base-border/60 hover:border-base-border"
              }`}
              onClick={() => handleToggleDue(due.id)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedDues.includes(due.id)}
                  onChange={() => handleToggleDue(due.id)}
                  className="rounded border-base-border"
                />
                <div>
                  <p className="text-sm font-medium">Cuota - {new Date(due.dueDate).toLocaleDateString("es-AR")}</p>
                  <p className="text-xs text-base-muted">Vencimiento: {new Date(due.dueDate).toLocaleDateString("es-AR")}</p>
                </div>
              </div>
              <p className="font-semibold">${due.amount.toLocaleString("es-AR")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Método de pago */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Método de pago</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as "EFECTIVO" | "TRANSFERENCIA" | "MERCADO_PAGO")}
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
          disabled={selectedDues.length === 0 || payMutation.isPending}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          {payMutation.isPending ? "Procesando..." : `Pagar $${totalAmount.toLocaleString("es-AR")}`}
        </motion.button>
      </div>
    </div>
  );
}
