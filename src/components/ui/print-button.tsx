"use client";

import { useState } from "react";
import { Loader2, Printer } from "lucide-react";

interface PrintButtonProps {
  onPrint: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PrintButton({ onPrint, disabled = false, className = "" }: PrintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      await onPrint();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      // Aquí podrías mostrar un toast o notificación de error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`btn-secondary flex items-center gap-2 ${className}`}
      onClick={handlePrint}
      disabled={disabled || isLoading}
      title="Exportar listado a PDF"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      {isLoading ? "Generando PDF..." : "Imprimir"}
    </button>
  );
}
