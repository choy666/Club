import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { ReportApiResponse, ReportFiltersInput } from "@/types/report";

export const REPORTS_KEY = ["reports"];

function buildReportsKey(filters: ReportFiltersInput) {
  return [...REPORTS_KEY, filters];
}

export function useReports(filters: ReportFiltersInput, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: buildReportsKey(filters),
    queryFn: async () => {
      const response = await apiFetch<ReportApiResponse>("/api/reportes", {
        method: "POST",
        body: JSON.stringify(filters),
      });
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateReports() {
  const queryClient = useQueryClient();
  return async (filters?: ReportFiltersInput) => {
    if (filters) {
      await queryClient.invalidateQueries({
        queryKey: buildReportsKey(filters),
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
  };
}
