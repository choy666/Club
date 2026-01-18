"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import { AuthButton } from "@/components/auth/auth-button";

const adminLinks = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/inscripciones", label: "Inscripciones" },
  { href: "/admin/reportes", label: "Reportes" },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const linkItems = useMemo(() => {
    return adminLinks.map((link) => {
      const isActive =
        pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setIsMenuOpen(false)}
          aria-current={isActive ? "page" : undefined}
          className={`group relative overflow-hidden rounded-full px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.3em] transition ${
            isActive ? "text-base-foreground" : "text-base-muted"
          }`}
        >
          <span
            className={`absolute inset-0 rounded-full blur-sm transition ${
              isActive
                ? "bg-accent-primary/30 shadow-[0_0_25px_rgba(248,113,113,0.35)]"
                : "group-hover:bg-accent-primary/15"
            }`}
          />
          <span className="relative z-10">{link.label}</span>
        </Link>
      );
    });
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(5,5,7,0.95))] px-4 py-3 text-xs uppercase tracking-[0.3em] text-base-muted backdrop-blur-2xl sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 text-[0.65rem] tracking-[0.5em]">
          <motion.div className="relative h-10 w-10" whileHover={{ rotate: 3 }}>
            <div className="absolute inset-0 rounded-2xl border border-white/15" />
            <div className="absolute inset-[2px] rounded-2xl bg-accent-primary/25 blur-md" />
            <div className="absolute inset-[6px] rounded-xl bg-gradient-to-br from-accent-primary/40 to-transparent shadow-[0_0_25px_rgba(248,113,113,0.45)]" />
            <Image src="/logo.png" alt="Club Logo" fill className="rounded-xl object-contain p-1" />
          </motion.div>
          <span className="text-base-foreground">Control · Admin</span>
        </Link>

        <nav
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] tracking-[0.35em] lg:flex"
          aria-label="Navegación administrativa"
        >
          {linkItems}
        </nav>

        <AuthButton variant="admin" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[0.6rem] tracking-[0.4em] text-base-muted transition hover:border-accent-primary hover:text-accent-primary lg:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="admin-nav-mobile"
        >
          Menú
          <span className="relative h-4 w-4">
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-current transition ${
                isMenuOpen ? "rotate-45" : "-translate-y-1"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full bg-current transition ${
                isMenuOpen ? "-rotate-45" : "translate-y-1"
              }`}
            />
          </span>
        </button>
      </div>

      <div
        id="admin-nav-mobile"
        className={`overflow-hidden border-t border-white/10 px-4 transition-[max-height,opacity,padding] duration-200 ease-out lg:hidden ${
          isMenuOpen
            ? "max-h-64 bg-base-primary/90 py-3 opacity-100"
            : "max-h-0 border-transparent py-0 opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="flex flex-col gap-2 text-sm" aria-label="Navegación administrativa móvil">
          {linkItems}
        </nav>

        <div className="mt-4 flex justify-center">
          <AuthButton variant="admin" />
        </div>
      </div>
    </header>
  );
}
