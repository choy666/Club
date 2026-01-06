import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function useMemberDuesStats(memberId: string) {
  return useQuery({
    queryKey: ["member-dues-stats", memberId],
    queryFn: async () => {
      const response = await apiFetch<{
        paidCount: number;
        totalCount: number;
        percentage: number;
      }>(`/api/socios/${memberId}/duotes-stats`);
      return response;
    },
    enabled: !!memberId,
    refetchOnWindowFocus: false,
  });
}
