import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import {
  CreateEnrollmentInput,
  PayDuesInput,
  UpdateEnrollmentInput,
} from "@/lib/validations/enrollments";
import type {
  DueListResponse,
  DueResponse,
  EnrollmentListResponse,
  EnrollmentResponse,
} from "@/types/enrollment";
import { useEnrollmentFiltersStore } from "@/store/enrollment-filters-store";
import { useDueFiltersStore } from "@/store/due-filters-store";
import type { MembersListResponse } from "@/types/member";

export const ENROLLMENTS_KEY = ["enrollments"] as const;
export const DUES_KEY = ["dues"] as const;
const MEMBERS_OPTIONS_KEY = ["members", "pending-options"];

export function useEnrollmentsList() {
  const filters = useEnrollmentFiltersStore();

  return useQuery({
    queryKey: [ENROLLMENTS_KEY, filters],
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

      const response = await apiFetch<EnrollmentListResponse>(
        `/api/inscripciones?${params.toString()}`
      );

      return response;
    },
    refetchOnWindowFocus: false,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEnrollmentInput) => {
      const response = await apiFetch<EnrollmentResponse>("/api/inscripciones", {
        method: "POST",
        body: JSON.stringify(input),
      });

      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { enrollmentId: string; input: UpdateEnrollmentInput }) => {
      const response = await apiFetch<EnrollmentResponse>(
        `/api/inscripciones/${params.enrollmentId}`,
        {
          method: "PUT",
          body: JSON.stringify(params.input),
        }
      );

      return response.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [ENROLLMENTS_KEY, variables.enrollmentId],
      });
      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await apiFetch<EnrollmentResponse>(`/api/inscripciones/${enrollmentId}`, {
        method: "DELETE",
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

export function usePayMultipleDues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PayDuesInput) => {
      const response = await apiFetch<{ paidDues: number; promotedToVitalicio: boolean }>(
        "/api/cuotas/pagar",
        {
          method: "POST",
          body: JSON.stringify(input),
        }
      );
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDuesList() {
  const filters = useDueFiltersStore();

  return useQuery({
    queryKey: [DUES_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page),
        perPage: String(filters.perPage),
      });

      if (filters.search.trim()) {
        params.set("search", filters.search.trim());
      }

      if (filters.status !== "ALL") {
        params.set("status", filters.status);
      }

      if (filters.memberId.trim()) {
        params.set("memberId", filters.memberId.trim());
      }

      if (filters.enrollmentId.trim()) {
        params.set("enrollmentId", filters.enrollmentId.trim());
      }

      if (filters.from) {
        params.set("from", filters.from);
      }

      if (filters.to) {
        params.set("to", filters.to);
      }

      const response = await apiFetch<DueListResponse>(`/api/cuotas?${params.toString()}`);

      return response;
    },
    refetchOnWindowFocus: false,
  });
}

export function usePayDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dueId, paidAt }: { dueId: string; paidAt?: string }) => {
      const response = await apiFetch<DueResponse>("/api/cuotas", {
        method: "POST",
        body: JSON.stringify({ dueId, paidAt }),
      });

      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
    },
  });
}

export function useMembersOptions() {
  return useQuery({
    queryKey: MEMBERS_OPTIONS_KEY,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        perPage: "50",
        status: "PENDING",
      });

      const response = await apiFetch<MembersListResponse>(`/api/socios?${params.toString()}`);

      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
