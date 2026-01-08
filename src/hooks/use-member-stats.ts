import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function useMemberDuesStats(memberId: string) {
  return useQuery({
    queryKey: ["member-dues-stats", memberId],
    queryFn: async () => {
      console.log("🔍 [HOOK] Ejecutando query de estadísticas para memberId:", memberId);
      try {
        const response = await apiFetch<{
          data: {
            paidCount: number;
            totalCount: number;
            percentage: number;
          };
        }>(`/api/socios/${memberId}/duotes-stats`);
        console.log("📥 [HOOK] Respuesta del API de estadísticas:", response);
        console.log("✅ [HOOK] Query de estadísticas exitosa");
        return response.data;
      } catch (error) {
        console.error("❌ [HOOK] Error en query de estadísticas:", error);
        throw error;
      }
    },
    enabled: !!memberId,
    refetchOnWindowFocus: false,
  });
}
