import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary } from "@/types/dashboard";

export const DASHBOARD_SUMMARY_KEY = ["dashboard-summary"];

export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_SUMMARY_KEY,
    queryFn: async () => {
      const response = await apiFetch<{ data: DashboardSummary }>("/api/dashboard/summary");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos en lugar de 1 minuto
    refetchInterval: 1000 * 60 * 5, // Refrescar cada 5 minutos en lugar de automáticamente
  });
}
