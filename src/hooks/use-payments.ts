import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { PaymentRecordResponse } from "@/types/payment";
import { DUES_KEY, ENROLLMENTS_KEY } from "@/hooks/use-enrollments";

interface RecordPaymentInput {
  dueId: string;
  amount?: number;
  method?: string;
  reference?: string;
  notes?: string;
  paidAt?: string;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecordPaymentInput) => {
      const response = await apiFetch<PaymentRecordResponse>("/api/pagos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para refrescar datos inmediatamente
      void queryClient.invalidateQueries({ queryKey: [DUES_KEY] });
      void queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["member"] });
      void queryClient.invalidateQueries({ queryKey: ["member-payments"] });
      void queryClient.invalidateQueries({ queryKey: ["member-payments-individual"] });
      void queryClient.invalidateQueries({ queryKey: ["member-summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["member-dues-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["member-current-dues"] });

      // Forzar refresco inmediato de las queries activas
      void queryClient.refetchQueries({ queryKey: [DUES_KEY] });
      void queryClient.refetchQueries({ queryKey: [ENROLLMENTS_KEY] });
      void queryClient.refetchQueries({ queryKey: ["member-payments-individual"] });
      void queryClient.refetchQueries({ queryKey: ["member-summaries"] });
    },
  });
}
