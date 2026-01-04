"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { formatCurrency } from "@/lib/number-format";

const quickActions = [
  { label: "Ver panel admin", href: "/admin" },
  { label: "Ingresar como socio", href: "/socio" },
];

const topNavLinks = [
  { href: "/admin", label: "Panel admin" },
  { href: "/admin/inscripciones", label: "Inscripciones" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/socio", label: "Portal socio" },
];

export default function Home() {
  const { data, isLoading, error } = useDashboardSummary();

  const quickStats = [
    {
      label: "Socios activos",
      value: data?.activeMembers?.toLocaleString("es-AR") ?? "—",
    },
    {
      label: "Cuotas pendientes",
      value:
        data && typeof data.pendingDuesAmount === "number"
          ? formatCurrency(data.pendingDuesAmount)
          : "—",
    },
    {
      label: "Inscripciones hoy",
      value: data?.enrollmentsToday?.toLocaleString("es-AR") ?? "—",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.25),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,transparent_55%)] opacity-70" />

      <header className="relative z-10 px-6 py-5 text-xs uppercase tracking-[0.35em] text-base-muted sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-3">
            <motion.div className="relative h-10 w-10" whileHover={{ rotate: 4 }}>
              <span className="absolute inset-0 rounded-2xl border border-white/15" />
              <span className="absolute inset-[4px] rounded-xl bg-accent-primary/25 blur-md" />
              <span className="absolute inset-[8px] rounded-lg bg-gradient-to-br from-accent-primary/40 to-transparent shadow-[0_0_25px_rgba(248,113,113,0.45)]" />
            </motion.div>
            <span className="text-base-foreground tracking-[0.4em]">Club · Plataforma</span>
          </Link>
          <nav className="flex flex-1 flex-wrap justify-center gap-2 text-[0.6rem]">
            {topNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-transparent px-4 py-1 transition hover:border-white/20 hover:text-accent-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="text-[0.55rem] tracking-[0.45em] text-base-muted">Admin · Socio</span>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-20 pt-10 text-base-foreground sm:px-12">
        <section className="mx-auto max-w-5xl space-y-12">
          <motion.div
            className="neo-panel flex flex-col gap-6 p-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="neo-chip">CLUB · GESTIÓN</span>
            <h1 className="text-4xl font-semibold font-[var(--font-space)] leading-tight sm:text-5xl">
              Control administrativo y acceso personalizado para cada socio.
            </h1>
            <p className="max-w-2xl text-lg text-base-muted">
              Plataforma unificada para inscripciones, cuotas, pagos y reportes. Ideal para equipos
              administrativos exigentes y socios que necesitan claridad total sobre su estado.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                <Link href="/admin" className="btn-primary">
                  Ir al panel admin
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                <Link href="/socio" className="btn-secondary">
                  Portal del socio
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="neo-panel space-y-2 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-base-muted">{stat.label}</p>
                <p className="text-2xl font-semibold">{isLoading ? "…" : stat.value}</p>
                {error ? <p className="text-xs text-accent-critical">No se pudo cargar.</p> : null}
              </motion.div>
            ))}
          </div>

          <div className="neo-panel flex flex-col gap-4 p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold font-[var(--font-space)]">Acciones rápidas</h2>
              <span className="text-xs uppercase tracking-[0.35em] text-base-muted">
                Atajos · Productividad
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.href}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.05 * index }}
                >
                  <Link
                    href={action.href}
                    className="flex items-center justify-between rounded-2xl border border-white/10 px-6 py-4 text-lg font-medium transition hover:border-accent-primary hover:text-accent-primary"
                  >
                    <span>{action.label}</span>
                    <span className="text-base-muted text-sm">→</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
