import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { EconomicConfigDTO } from "@/types/economic-config";

const ECONOMIC_CONFIG_KEY = (slug: string) => ["economic-config", slug];

export function useEconomicConfig(slug = "default") {
  return useQuery({
    queryKey: ECONOMIC_CONFIG_KEY(slug),
    queryFn: async () => {
      const response = await apiFetch<{ data: EconomicConfigDTO }>(
        `/api/config/economic?slug=${slug}`,
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
