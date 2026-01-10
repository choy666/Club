import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Claves de consulta principales que necesitan ser invalidadas al navegar
const MAIN_QUERY_KEYS = [
  ["members"],
  ["enrollments"],
  ["dues"],
  ["member-summaries"],
  ["dashboard-summary"],
  ["reports"],
  ["members", "pending-options"],
] as const;

/**
 * Hook personalizado para recargar automáticamente los datos al navegar entre páginas
 * Invalida el caché de las consultas principales para asegurar datos frescos
 */
export function useAutoRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Función para invalidar todas las consultas principales
    const refreshData = async () => {
      try {
        // Invalidar todas las consultas principales en paralelo
        await Promise.all(
          MAIN_QUERY_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );

        // También invalidar consultas específicas que puedan existir
        await queryClient.invalidateQueries({ queryKey: ["member", "me"] });
        await queryClient.invalidateQueries({ queryKey: ["member", "me", "snapshot"] });
        await queryClient.invalidateQueries({ queryKey: ["member", "me", "credential"] });

        console.log("🔄 [AUTO_REFRESH] Datos actualizados automáticamente");
      } catch (error) {
        console.error("❌ [AUTO_REFRESH] Error al actualizar datos:", error);
      }
    };

    // Ejecutar la recarga inmediata al montar el componente
    void refreshData();

    // Opcional: Configurar un intervalo para recargas periódicas (cada 5 minutos)
    const intervalId = setInterval(refreshData, 1000 * 60 * 5);

    // Limpiar el intervalo al desmontar
    return () => {
      clearInterval(intervalId);
    };
  }, [queryClient]);
}

/**
 * Hook para forzar una recarga manual de todos los datos
 * Útil para acciones críticas que necesitan sincronización inmediata
 */
export function useForceRefresh() {
  const queryClient = useQueryClient();

  const forceRefresh = async () => {
    try {
      // Refrescar todas las consultas principales inmediatamente
      await Promise.all(
        MAIN_QUERY_KEYS.map((key) => queryClient.refetchQueries({ queryKey: key }))
      );

      // Refrescar consultas específicas
      await queryClient.refetchQueries({ queryKey: ["member", "me"] });
      await queryClient.refetchQueries({ queryKey: ["member", "me", "snapshot"] });
      await queryClient.refetchQueries({ queryKey: ["member", "me", "credential"] });

      console.log("🔄 [FORCE_REFRESH] Recarga forzada completada");
    } catch (error) {
      console.error("❌ [FORCE_REFRESH] Error en recarga forzada:", error);
    }
  };

  return { forceRefresh };
}

/**
 * Hook para detectar cambios de visibilidad de la pestaña y recargar datos
 * Cuando el usuario vuelve a la pestaña, se actualizan los datos
 */
export function useVisibilityRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Recargar datos cuando la pestaña se hace visible
        void Promise.all(
          MAIN_QUERY_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );
        console.log("👁️ [VISIBILITY_REFRESH] Datos actualizados al volver a la pestaña");
      }
    };

    // Escuchar cambios de visibilidad
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);
}
