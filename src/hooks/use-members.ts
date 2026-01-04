import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type {
  MemberFinancialSnapshot,
  MemberFinancialSnapshotResponse,
  MemberResponse,
  MembersListResponse,
} from "@/types/member";
import { useMemberFiltersStore } from "@/store/members-filters-store";
import type { CreateMemberInput, UpdateMemberInput } from "@/lib/validations/members";

const MEMBERS_KEY = ["members"];
const MEMBER_DETAIL_KEY = (id: string) => [...MEMBERS_KEY, id];
const MEMBER_ME_KEY = ["member", "me"];
const MEMBER_SNAPSHOT_KEY = (memberId: string | null) => [
  "member",
  "snapshot",
  memberId ?? "unknown",
];
const MEMBER_SELF_SNAPSHOT_KEY = ["member", "me", "snapshot"];

export function useMembersList() {
  const filters = useMemberFiltersStore();

  return useQuery({
    queryKey: [...MEMBERS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page),
        perPage: String(filters.perPage),
      });

      if (filters.status !== "ALL") {
        params.set("status", filters.status);
      }

      if (filters.search.trim()) {
        params.set("search", filters.search.trim());
      }

      const response = await apiFetch<MembersListResponse>(`/api/socios?${params.toString()}`);

      return response;
    },
    refetchOnWindowFocus: false,
  });
}

export function useMemberFinancialSnapshot(memberId?: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery<MemberFinancialSnapshot | null>({
    queryKey: MEMBER_SNAPSHOT_KEY(memberId ?? null),
    enabled: Boolean(memberId && enabled),
    queryFn: async () => {
      if (!memberId) {
        return null;
      }
      const response = await apiFetch<MemberFinancialSnapshotResponse>(
        `/api/socios/${memberId}/status`
      );
      return response.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useMyFinancialSnapshot(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery<MemberFinancialSnapshot>({
    queryKey: MEMBER_SELF_SNAPSHOT_KEY,
    enabled,
    queryFn: async () => {
      const response = await apiFetch<MemberFinancialSnapshotResponse>("/api/socios/me/status");
      return response.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useMemberDetail(memberId?: string) {
  return useQuery({
    queryKey: memberId ? MEMBER_DETAIL_KEY(memberId) : [],
    queryFn: async () => {
      if (!memberId) return null;
      const response = await apiFetch<MemberResponse>(`/api/socios/${memberId}`);
      return response.data;
    },
    enabled: Boolean(memberId),
  });
}

export function useMemberProfile() {
  return useQuery({
    queryKey: MEMBER_ME_KEY,
    queryFn: async () => {
      const response = await apiFetch<MemberResponse>("/api/socios/me");
      return response.data;
    },
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMemberInput) => {
      const response = await apiFetch<MemberResponse>("/api/socios", {
        method: "POST",
        body: JSON.stringify(input),
      });

      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, input }: { memberId: string; input: UpdateMemberInput }) => {
      const response = await apiFetch<MemberResponse>(`/api/socios/${memberId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });

      return response.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: MEMBER_DETAIL_KEY(variables.memberId),
      });
      void queryClient.invalidateQueries({
        queryKey: MEMBERS_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: MEMBER_ME_KEY });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      await apiFetch(`/api/socios/${memberId}`, {
        method: "DELETE",
      });
      return memberId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}
