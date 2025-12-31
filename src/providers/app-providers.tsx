"use client";

import { SessionProvider, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ReactQueryProvider } from "./react-query";
import { useAuthStore } from "@/store/auth-store";

interface AppProvidersProps {
  children: ReactNode;
}

function SessionStateBridge() {
  const { data, status } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const reset = useAuthStore((state) => state.reset);

  useEffect(() => {
    if (status === "loading") return;

    if (data?.user) {
      setUser(data.user);
    } else {
      reset();
    }
  }, [data?.user, status, reset, setUser]);

  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        <SessionStateBridge />
        {children}
      </ReactQueryProvider>
    </SessionProvider>
  );
}
