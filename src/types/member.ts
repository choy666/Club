import type { memberStatusEnum } from "@/db/schema";

export type MemberStatus = (typeof memberStatusEnum.enumValues)[number];

export interface MemberDTO {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  documentNumber: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  status: MemberStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MembersListResponse {
  data: MemberDTO[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface MemberResponse {
  data: MemberDTO;
}

export interface MemberFinancialSnapshot {
  memberId: string;
  status: MemberStatus;
  totals: {
    pending: number;
    overdue: number;
    paid: number;
    frozen: number;
  };
  nextDueDate: string | null;
  gracePeriodDays: number;
}

export interface MemberFinancialSnapshotResponse {
  data: MemberFinancialSnapshot;
}
