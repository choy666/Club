import type { DueDTO } from "@/types/enrollment";

export interface PaymentDTO {
  id: string;
  memberId: string;
  dueId: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecordResponse {
  data: {
    due: DueDTO;
    payment: PaymentDTO;
  };
}
