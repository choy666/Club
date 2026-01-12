import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function useMemberCurrentDues(memberId: string) {
  return useQuery({
    queryKey: ["member-current-dues", memberId],
    queryFn: async () => {
      console.log("🔍 [HOOK] Ejecutando query de cuotas actuales para memberId:", memberId);
      try {
        const response = await apiFetch<{
          data: {
            dues: Array<{
              id: string;
              dueDate: string;
              status: string;
              amount: number;
              paidAt: string | null;
            }>;
            isCurrentMonthPaid: boolean;
            currentMonth: {
              year: number;
              month: number;
              firstDay: string;
              lastDay: string;
            };
          };
        }>(`/api/socios/${memberId}/current-dues`);
        console.log("📥 [HOOK] Respuesta del API de cuotas actuales:", response);
        console.log("✅ [HOOK] Query de cuotas actuales exitosa");
        return response.data;
      } catch (error) {
        console.error("❌ [HOOK] Error en query de cuotas actuales:", error);
        throw error;
      }
    },
    enabled: !!memberId,
    staleTime: 0, // Sin cache - siempre fresco
    gcTime: 0, // Sin garbage collection - siempre fresh
    refetchOnMount: true, // Forzar refresco al montar
    refetchOnWindowFocus: true, // Forzar refresco al cambiar de ventana
  });
}
