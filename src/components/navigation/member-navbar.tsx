"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

import { AuthButton } from "@/components/auth/auth-button";

const memberLinks = [
  { href: "/socio", label: "Resumen" },
  { href: "/socio#estado", label: "Estado financiero" },
  { href: "/socio#perfil", label: "Perfil" },
  { href: "/socio#acciones", label: "Acciones" },
];

export function MemberNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>("");

  useEffect(() => {
    const syncHash = () => {
      if (typeof window === "undefined") return;
      setActiveHash(window.location.hash.replace("#", ""));
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const linkItems = memberLinks.map((link) => {
    const hash = link.href.split("#")[1];
    const isHashActive = hash ? activeHash === hash : activeHash === "";
    const isRouteActive = pathname === "/socio" && !hash;
    const isActive = pathname === "/socio" && (hash ? isHashActive : isRouteActive);

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setIsMenuOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={`group relative overflow-hidden rounded-full px-4 py-1.5 text-sm font-medium transition ${
          isActive ? "text-base-foreground" : "text-base-muted hover:text-base-foreground"
        }`}
      >
        <span
          className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400/30 to-transparent opacity-0 transition duration-200 ${
            isActive ? "opacity-100" : "group-hover:opacity-70"
          }`}
        />
        <span className="relative z-10">{link.label}</span>
        <span
          className={`absolute inset-x-3 bottom-1 h-px rounded-full bg-emerald-300/70 transition ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
          }`}
        />
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-base-border/50 bg-base-primary/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/socio"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-base-muted"
        >
          <div className="relative h-8 w-8">
            <Image src="/logo.png" alt="Club Logo" fill className="object-contain opacity-90" />
          </div>
          <span>Portal · Socio</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-base-border/60 bg-base-secondary/30 px-3 py-1 text-sm lg:flex">
          {linkItems}
        </nav>

        <AuthButton variant="member" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-base-border/60 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-base-muted transition hover:border-emerald-300 hover:text-emerald-200 lg:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="member-nav-mobile"
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
        id="member-nav-mobile"
        className={`border-t border-base-border/60 bg-base-primary/90 px-4 py-3 transition-all duration-200 lg:hidden ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="flex flex-col gap-2 text-sm">{linkItems}</nav>

        <div className="mt-4 flex justify-center">
          <AuthButton variant="member" />
        </div>
      </div>
    </header>
  );
}
