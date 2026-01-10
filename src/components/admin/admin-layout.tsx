"use client";

import { useAutoRefresh } from "@/hooks/use-auto-refresh";

/**
 * Componente de layout que habilita la recarga automática en todas las páginas del admin
 * Se debe envolver el contenido de las páginas del admin con este componente
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  // Activar recarga automática para todas las páginas del admin
  useAutoRefresh();

  return <>{children}</>;
}
