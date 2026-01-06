"use client";

import { motion } from "framer-motion";

interface DeactivateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  hasPaidDues: boolean;
  isLoading?: boolean;
}

export function DeactivateMemberModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  hasPaidDues,
  isLoading = false,
}: DeactivateMemberModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="neo-panel max-w-md w-full mx-4"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Confirmar Baja de Socio</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-base-muted hover:text-base-foreground"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="rounded-lg bg-accent-critical/10 border border-accent-critical/20 p-4">
              <p className="text-sm text-accent-critical">
                {hasPaidDues
                  ? "⚠️ Este socio tiene cuotas pagadas y no puede ser eliminado."
                  : "⚠️ Estás a punto de dar de baja a este socio."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Socio:</span> {memberName}
              </p>
              
              {hasPaidDues ? (
                <div className="text-sm text-base-muted space-y-2">
                  <p>• El socio tiene cuotas pagadas registradas</p>
                  <p>• Por política, no se pueden eliminar socios con cuotas pagadas</p>
                  <p>• Considera cambiar el estado a INACTIVO en su lugar</p>
                </div>
              ) : (
                <div className="text-sm text-base-muted space-y-2">
                  <p>• Todas las cuotas pendientes serán congeladas</p>
                  <p>• El socio pasará a estado INACTIVO</p>
                  <p>• Esta acción no se puede deshacer</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            
            {!hasPaidDues && (
              <motion.button
                type="button"
                onClick={onConfirm}
                className="flex-1 btn-critical"
                disabled={isLoading}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
              >
                {isLoading ? "Procesando..." : "Confirmar Baja"}
              </motion.button>
            )}
          </div>

          {hasPaidDues && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  // Aquí podrías redirigir al formulario de edición
                  onClose();
                }}
                className="text-sm text-accent-primary hover:underline"
              >
                Ir a edición de socio
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
