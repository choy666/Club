import { create } from "zustand";
import type { DueStatus } from "@/types/enrollment";

interface DueFiltersState {
  status: DueStatus | "ALL";
  memberId: string;
  enrollmentId: string;
  from: string;
  to: string;
  page: number;
  perPage: number;
  setStatus: (value: DueStatus | "ALL") => void;
  setMemberId: (value: string) => void;
  setEnrollmentId: (value: string) => void;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setPage: (value: number) => void;
  setPerPage: (value: number) => void;
  resetFilters: () => void;
}

const DEFAULT_STATE: Omit<
  DueFiltersState,
  | "setStatus"
  | "setMemberId"
  | "setEnrollmentId"
  | "setFrom"
  | "setTo"
  | "setPage"
  | "setPerPage"
  | "resetFilters"
> = {
  status: "ALL",
  memberId: "",
  enrollmentId: "",
  from: "",
  to: "",
  page: 1,
  perPage: 50,
};

export const useDueFiltersStore = create<DueFiltersState>((set) => ({
  ...DEFAULT_STATE,
  setStatus: (value) =>
    set({
      status: value,
      page: 1,
    }),
  setMemberId: (value) =>
    set({
      memberId: value,
      page: 1,
    }),
  setEnrollmentId: (value) =>
    set({
      enrollmentId: value,
      page: 1,
    }),
  setFrom: (value) =>
    set({
      from: value,
      page: 1,
    }),
  setTo: (value) =>
    set({
      to: value,
      page: 1,
    }),
  setPage: (value) => set({ page: value }),
  setPerPage: (value) =>
    set({
      perPage: value,
      page: 1,
    }),
  resetFilters: () => set({ ...DEFAULT_STATE }),
}));
