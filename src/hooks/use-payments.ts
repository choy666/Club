import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { PaymentRecordResponse } from "@/types/payment";
import { DUES_KEY } from "@/hooks/use-enrollments";

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
      void queryClient.invalidateQueries({ queryKey: DUES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}
