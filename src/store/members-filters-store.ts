import { create } from "zustand";
import type { MemberStatus } from "@/types/member";

interface FiltersState {
  search: string;
  status: MemberStatus | "ALL";
  page: number;
  perPage: number;
  setSearch: (value: string) => void;
  setStatus: (value: MemberStatus | "ALL") => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  resetFilters: () => void;
}

const DEFAULT_STATE = {
  search: "",
  status: "ALL" as FiltersState["status"],
  page: 1,
  perPage: 10,
};

export const useMemberFiltersStore = create<FiltersState>((set) => ({
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
