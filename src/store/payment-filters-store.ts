import { create } from "zustand";

interface PaymentFiltersState {
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  resetFilters: () => void;
}

const DEFAULT_STATE: Omit<PaymentFiltersState, "setPage" | "setPerPage" | "resetFilters"> = {
  page: 1,
  perPage: 10, // Mostrar menos items en la modal para mejor UX
};

export const usePaymentFiltersStore = create<PaymentFiltersState>((set) => ({
  ...DEFAULT_STATE,
  setPage: (page) => set({ page }),
  setPerPage: (perPage) =>
    set({
      perPage,
      page: 1,
    }),
  resetFilters: () => set({ ...DEFAULT_STATE }),
}));
