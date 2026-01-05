"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

export function AuthButton({ variant = "admin" }: { variant?: "admin" | "member" }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />;
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className={`group relative overflow-hidden rounded-full border px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.3em] transition ${
          variant === "admin"
            ? "border-white/15 text-base-muted hover:border-accent-primary hover:text-accent-primary"
            : "border-base-border/60 text-base-muted hover:border-emerald-300 hover:text-emerald-200"
        }`}
      >
        <span
          className={`absolute inset-0 rounded-full transition ${
            variant === "admin"
              ? "group-hover:bg-accent-primary/15"
              : "group-hover:bg-emerald-400/15"
          }`}
        />
        <span className="relative z-10">Sign In</span>
      </Link>
    );
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block">
        <span
          className={`text-[0.6rem] uppercase tracking-[0.3em] ${
            variant === "admin" ? "text-base-muted/70" : "text-base-muted/60"
          }`}
        >
          {session.user?.name || session.user?.email}
        </span>
      </div>

      <motion.button
        type="button"
        onClick={handleSignOut}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`group relative overflow-hidden rounded-full border px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.3em] transition ${
          variant === "admin"
            ? "border-accent-primary/50 text-accent-primary hover:border-accent-primary hover:bg-accent-primary/10"
            : "border-emerald-300/50 text-emerald-300 hover:border-emerald-300 hover:bg-emerald-400/10"
        }`}
      >
        <span
          className={`absolute inset-0 rounded-full opacity-0 transition group-hover:opacity-20 ${
            variant === "admin" ? "bg-accent-primary" : "bg-emerald-400"
          }`}
        />
        <span className="relative z-10">Log Out</span>
      </motion.button>
    </div>
  );
}
