"use client";

import { ReactNode } from "react";
import { useAutoRefresh, useVisibilityRefresh } from "@/hooks/use-auto-refresh";

/**
 * Componente de layout que habilita la recarga automática en todas las páginas
 * Incluye recarga al navegar y al cambiar de visibilidad de la pestaña
 */
export function AutoRefreshLayout({ children }: { children: ReactNode }) {
  // Activar recarga automática al navegar
  useAutoRefresh();

  // Activar recarga al volver a la pestaña
  useVisibilityRefresh();

  return <>{children}</>;
}
