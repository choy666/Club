import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

export interface MemberStats {
  vitalicioActivo: number;
  vitalicioInactivo: number;
  activo: number;
  alDia: number;
  inactivo: number;
  pendiente: number;
  total: number;
}

export interface MemberStatsResponse {
  data: MemberStats;
}

export const MEMBERS_STATS_KEY = ["members", "stats"];

export function useMembersStats() {
  return useQuery({
    queryKey: MEMBERS_STATS_KEY,
    queryFn: async () => {
      const response = await apiFetch<MemberStatsResponse>("/api/socios/stats");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
}
