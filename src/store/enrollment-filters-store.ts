import { create } from "zustand";
import type { EnrollmentStatus } from "@/types/enrollment";

interface EnrollmentFiltersState {
  search: string;
  status: EnrollmentStatus | "ALL";
  page: number;
  perPage: number;
  setSearch: (value: string) => void;
  setStatus: (value: EnrollmentStatus | "ALL") => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  resetFilters: () => void;
}

const DEFAULT_STATE: Omit<
  EnrollmentFiltersState,
  "setSearch" | "setStatus" | "setPage" | "setPerPage" | "resetFilters"
> = {
  search: "",
  status: "ALL",
  page: 1,
  perPage: 10,
};

export const useEnrollmentFiltersStore = create<EnrollmentFiltersState>((set) => ({
  ...DEFAULT_STATE,
  setSearch: (value) =>
    set({
      search: value,
      page: 1,
    }),
  setStatus: (value) =>
    set({
      status: value,
      page: 1,
    }),
  setPage: (page) => set({ page }),
  setPerPage: (perPage) =>
    set({
      perPage,
      page: 1,
    }),
  resetFilters: () => set({ ...DEFAULT_STATE }),
}));
