import type { dueStatusEnum, enrollmentStatusEnum, members } from "@/db/schema";

export type EnrollmentStatus = (typeof enrollmentStatusEnum.enumValues)[number];
export type DueStatus = (typeof dueStatusEnum.enumValues)[number];

export interface EnrollmentDTO {
  id: string;
  memberId: string;
  startDate: string;
  planName: string | null;
  monthlyAmount: number;
  status: EnrollmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  hasPaidDues: boolean;
  member: {
    id: string;
    name: string | null;
    email: string;
    documentNumber: string;
    status: typeof members.$inferSelect.status;
  };
}

export interface MemberCredentialDTO {
  member: {
    id: string;
    name: string | null;
    email: string;
    documentNumber: string;
    status: typeof members.$inferSelect.status;
  };
  enrollment: {
    id: string;
    planName: string | null;
    monthlyAmount: number;
    status: EnrollmentStatus;
    startDate: string;
    updatedAt: string;
  } | null;
  credential: {
    code: string;
    issuedAt: string;
    qrPayload: string;
  } | null;
  isReady: boolean;
}

export interface MemberCredentialResponse {
  data: MemberCredentialDTO;
}

export interface EnrollmentListResponse {
  data: EnrollmentDTO[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface DueDTO {
  id: string;
  enrollmentId: string;
  memberId: string;
  dueDate: string;
  amount: number;
  status: DueStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    name: string | null;
    email: string;
    documentNumber: string;
  };
  enrollment: {
    id: string;
    planName: string | null;
    monthlyAmount: number;
    startDate?: string;
  };
}

export interface DueListResponse {
  data: DueDTO[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface EnrollmentResponse {
  data: EnrollmentDTO;
}

export interface DueResponse {
  data: DueDTO;
}
