import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import {
  CreateEnrollmentInput,
  PayDuesInput,
  PaySequentialDuesInput,
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
import type { MemberSummary } from "@/components/enrollments/due-table";
import { DASHBOARD_SUMMARY_KEY } from "@/hooks/use-dashboard-summary";
import { REPORTS_KEY } from "@/hooks/use-reports";

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
      // Logging detallado antes de enviar al backend
      console.log("🚀 [HOOK] Enviando inscripción al backend:", {
        input,
        timestamp: new Date().toISOString(),
        timezoneOffset: new Date().getTimezoneOffset(),
        localDate: new Date().toLocaleString("es-AR"),
        parsedStartDate: {
          original: input.startDate,
          type: typeof input.startDate,
        },
      });

      const response = await apiFetch<EnrollmentResponse>("/api/inscripciones", {
        method: "POST",
        body: JSON.stringify(input),
      });

      console.log("📥 [HOOK] Respuesta del backend:", {
        response,
        data: response.data,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    },
    onSuccess: (data) => {
      console.log("✅ [HOOK] Inscripción creada exitosamente:", {
        enrollmentId: data.id,
        startDate: data.startDate,
        memberName: data.member?.name,
        timestamp: new Date().toISOString(),
      });

      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["member-summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: MEMBERS_OPTIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      void queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
    onError: (error) => {
      console.error("❌ [HOOK] Error al crear inscripción:", {
        error,
        timestamp: new Date().toISOString(),
      });
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
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["member-summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: MEMBERS_OPTIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      void queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
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
      void queryClient.invalidateQueries({ queryKey: ["member-summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: MEMBERS_OPTIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      void queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
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
      void queryClient.invalidateQueries({ queryKey: ["member-summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: MEMBERS_OPTIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      void queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
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

      if (filters.status !== "ALL") {
        params.set("status", filters.status);
      }

      if (filters.search.trim()) {
        params.set("search", filters.search.trim());
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
    staleTime: 1000 * 30, // 30 segundos para refrescar más rápido después de pagos
  });
}

export function useMemberSummaries() {
  return useQuery({
    queryKey: ["member-summaries"],
    queryFn: async () => {
      console.log("🔍 [HOOK] Obteniendo resúmenes completos de socios...");
      const response = await apiFetch<{ data: MemberSummary[] }>("/api/cuotas/resumen");
      console.log("📥 [HOOK] Resúmenes recibidos:", response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutos
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
      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["member-summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: MEMBERS_OPTIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      void queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
}

export function usePaySequentialDues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PaySequentialDuesInput) => {
      const response = await apiFetch<{
        paidDues: number;
        totalAmount: number;
        promotedToVitalicio: boolean;
        nextDueDate: string | null;
      }>("/api/cuotas/pagar-secuencial", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["member-summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: MEMBERS_OPTIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      void queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
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
