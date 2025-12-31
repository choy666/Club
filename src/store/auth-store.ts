import type { Session } from "next-auth";
import { create } from "zustand";

type SessionUser = Session["user"] | null;

interface AuthState {
  user: SessionUser;
  setUser: (user: SessionUser) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  reset: () => set({ user: null }),
}));
