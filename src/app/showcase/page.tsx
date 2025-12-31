import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const overviewHighlights = [
  {
    label: "Automatizaciones vivas",
    value: "18 flujos operativos",
    detail: "Alta, inscripción, cuotas y recordatorios sincronizados.",
  },
  {
    label: "Tiempo de onboarding",
    value: "-62%",
    detail: "Formularios únicos + validaciones en servidor reducen errores.",
  },
  {
    label: "Conciliación mensual",
    value: "100%",
    detail: "Pagos y cuotas se reconcilian con hooks React Query.",
  },
  {
    label: "Disponibilidad",
    value: "99.9%",
    detail: "Infra Vercel + Neon administrada con monitoreo continuo.",
  },
];

const features = [
  {
    icon: "orbit",
    title: "Panel único administrador",
    description:
      "Dashboard dark mode con métricas, tablas y formularios reutilizables para operar todo el ciclo de socios.",
  },
  {
    icon: "layers",
    title: "Cuotas inteligentes",
    description:
      "Generación automática ligada a planes, vencimientos y alertas de deuda con estilos glass-card.",
  },
  {
    icon: "shield",
    title: "Autenticación con roles",
    description:
      "NextAuth v5 + SessionProvider proveen acceso seguro y scoped a `/admin` y `/socio`.",
  },
  {
    icon: "zap",
    title: "Flujos en tiempo real",
    description:
      "React Query + Zustand mantienen sincronizados filtros, tablas y mutaciones sin recargar.",
  },
  {
    icon: "globe",
    title: "Integración de pagos",
    description:
      "Soporte para Mercado Pago con webhooks, conciliación y estados financieros dentro del panel.",
  },
  {
    icon: "cpu",
    title: "Arquitectura preparada",
    description:
      "Stack Next.js 15, Drizzle y Neon ya desplegado para escalar features sin reescrituras.",
  },
];

const integrations = [
  { name: "Mercado Pago", type: "Pagos", status: "En progreso" },
  { name: "NextAuth v5", type: "Autenticación", status: "Live" },
  { name: "React Query 5.9", type: "Data Layer", status: "Live" },
  { name: "Zustand 5", type: "State", status: "Live" },
  { name: "Neon PostgreSQL", type: "Base de datos", status: "Live" },
  { name: "Drizzle ORM", type: "ORM", status: "Live" },
  { name: "Framer Motion 12", type: "Animaciones", status: "Planeado" },
];

const logicFlow = [
  {
    title: "Alta de socio",
    detail:
      "Validación administrativa, registro en BD y activación de credenciales.",
  },
  {
    title: "Inscripción",
    detail:
      "Selección de plan, generación de inscripción y definición de cuotas iniciales.",
  },
  {
    title: "Emisión de cuotas",
    detail:
      "Jobs generan cuotas mensuales con vencimientos y montos parametrizados.",
  },
  {
    title: "Pagos y conciliación",
    detail:
      "Recepción de pagos (Mercado Pago) y actualización automática del estado financiero.",
  },
  {
    title: "Reportes ejecutivos",
    detail:
      "Dashboards de deuda, recaudo y retención disponibles para comité directivo.",
  },
];

const techStack = {
  frontend: [
    {
      label: "Next.js 15.5 App Router",
      detail: "SSR + RSC + layouts anidados",
    },
    { label: "Tailwind 4 + glassmorphism", detail: "Sistema visual oscuro" },
    { label: "Framer Motion 12", detail: "Animaciones suaves y discretas" },
  ],
  backend: [
    { label: "Next.js API Routes", detail: "Endpoints protegidos con roles" },
    { label: "Drizzle ORM 0.44", detail: "Schema tipado y migraciones" },
    { label: "NextAuth v5", detail: "Credenciales administradas + JWT" },
  ],
  infra: [
    { label: "Neon PostgreSQL", detail: "Base serverless con replicas" },
    { label: "Vercel", detail: "Deploy continuo y edge caching" },
    { label: "GitHub Actions", detail: "CI para lint + tests" },
  ],
};

const roadmap = [
  {
    title: "Pagos online y conciliación automática",
    status: "En curso",
    date: "Q1 2026",
    description:
      "Webhooks Mercado Pago + conciliador interno para estados de cuota en tiempo real.",
  },
  {
    title: "Reportes avanzados + dashboards",
    status: "Planeado",
    date: "Q2 2026",
    description:
      "Visualizaciones comparativas, cohortes y proyecciones financieras para directorio.",
  },
  {
    title: "Portal socio móvil",
    status: "Planeado",
    date: "Q3 2026",
    description:
      "Experiencia optimizada para pagos, credenciales digitales y comunicaciones.",
  },
];

const statusColors: Record<string, string> = {
  Live: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  "En progreso": "text-amber-300 border-amber-500/40 bg-amber-500/10",
  "En curso": "text-amber-300 border-amber-500/40 bg-amber-500/10",
  Planeado: "text-slate-300 border-slate-600/50 bg-slate-600/10",
};

const iconMap: Record<string, ReactNode> = {
  orbit: (
    <svg
      className="h-6 w-6 text-accent-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="2" />
      <path d="M4 12c0-2.21 4-6 8-6s8 3.79 8 6-4 6-8 6-8-3.79-8-6Z" />
    </svg>
  ),
  layers: (
    <svg
      className="h-6 w-6 text-accent-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 18 9 5 9-5" />
    </svg>
  ),
  shield: (
    <svg
      className="h-6 w-6 text-accent-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 3 4 6v6c0 5 3.58 9.74 8 11 4.42-1.26 8-6 8-11V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  zap: (
    <svg
      className="h-6 w-6 text-accent-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
  ),
  globe: (
    <svg
      className="h-6 w-6 text-accent-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 3 2.5 15 0 18" />
    </svg>
  ),
  cpu: (
    <svg
      className="h-6 w-6 text-accent-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>
  ),
};

export const metadata: Metadata = {
  title: "Showcase · Club",
  description:
    "Pitch visual del sistema Club: arquitectura, integraciones y roadmap listos para inversores y equipo técnico.",
};

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-base-primary px-6 py-12 text-base-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <section className="relative overflow-hidden rounded-3xl border border-base-border/80 bg-[radial-gradient(circle_at_top,_rgba(198,40,40,0.25),_rgba(3,7,18,0.4))] p-10 text-center shadow-2xl shadow-black/40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col gap-6">
            <span className="text-sm uppercase tracking-[0.3em] text-base-muted">
              Club · Infraestructura viva
            </span>
            <h1 className="text-4xl font-semibold sm:text-5xl">
              Plataforma institucional que combina tradición y software moderno
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-base-muted">
              El sistema Club unifica socios, inscripciones, cuotas y pagos en
              un mismo tablero. Está listo para exhibir valor frente a
              inversores, directorio y equipos técnicos.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/admin"
                className="btn-primary px-6 py-3 text-base font-medium transition hover:translate-y-0.5"
              >
                Ver demo administradores
              </Link>
              <Link
                href="mailto:comite@club.ar"
                className="rounded-full border border-base-border px-6 py-3 text-base font-medium text-base-muted transition hover:border-accent-primary hover:text-base-foreground"
              >
                Descargar deck ejecutivo
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Project Overview
            </p>
            <h2 className="text-3xl font-semibold">Problema · Solución</h2>
            <p className="text-base text-base-muted sm:max-w-3xl">
              El club necesitaba centralizar operaciones administrativas,
              reducir tiempos manuales y ofrecer transparencia financiera. La
              arquitectura actual responde con procesos guiados, datos en tiempo
              real y un lenguaje visual consistente.
            </p>
          </header>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="glass-card space-y-5 p-8">
              <h3 className="text-2xl font-semibold text-base-foreground">
                Cómo resolvemos el reto
              </h3>
              <ul className="space-y-4 text-base text-base-muted">
                <li>
                  Workflows definidos de principio a fin: desde alta de socio
                  hasta reporte financiero.
                </li>
                <li>
                  Componentes glass-card reutilizables con estados claros y
                  accesibles.
                </li>
                <li>
                  Integración progresiva con medios de pago y notificaciones
                  asincrónicas.
                </li>
              </ul>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {overviewHighlights.map((item) => (
                <div
                  key={item.label}
                  className="glass-card flex flex-col gap-2 p-6 transition hover:-translate-y-1"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                    {item.label}
                  </p>
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="text-sm text-base-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Core Features
            </p>
            <h2 className="text-3xl font-semibold">Capacidades clave</h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="glass-card flex flex-col gap-4 p-6 transition hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-primary/40 bg-accent-primary/10">
                  {iconMap[feature.icon]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-base-muted">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Coverage & Integrations
            </p>
            <h2 className="text-3xl font-semibold">
              Conectado con herramientas reales
            </h2>
          </header>
          <div className="glass-card p-8">
            <div className="flex flex-wrap gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex flex-1 min-w-[220px] items-center justify-between rounded-2xl border border-base-border/60 px-5 py-4"
                >
                  <div>
                    <p className="text-sm uppercase tracking-widest text-base-muted">
                      {integration.type}
                    </p>
                    <p className="text-lg font-semibold">{integration.name}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[integration.status] ?? "text-base-muted border-base-border/50"}`}
                  >
                    {integration.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              System Logic Flow
            </p>
            <h2 className="text-3xl font-semibold">Ruta completa del socio</h2>
          </header>
          <div className="relative pl-6">
            <span className="absolute left-3 top-0 h-full w-px bg-base-border/60" />
            <div className="space-y-8">
              {logicFlow.map((step, index) => (
                <div key={step.title} className="relative pl-8">
                  <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border border-accent-primary bg-accent-primary/20" />
                  <div className="glass-card space-y-2 p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
                      Paso {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-sm text-base-muted">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Tech Stack
            </p>
            <h2 className="text-3xl font-semibold">
              Base tecnológica consolidada
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(techStack).map(([category, items]) => (
              <div key={category} className="glass-card space-y-4 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-base-muted">
                  {category}
                </p>
                <ul className="space-y-3 text-sm text-base-muted">
                  {items.map((item) => (
                    <li key={item.label}>
                      <p className="text-base font-semibold text-base-foreground">
                        {item.label}
                      </p>
                      <p>{item.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Roadmap & Future
            </p>
            <h2 className="text-3xl font-semibold">
              Iteraciones con entregables claros
            </h2>
          </header>
          <div className="space-y-4">
            {roadmap.map((item) => (
              <article
                key={item.title}
                className="glass-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
                    {item.date}
                  </p>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-base-muted">{item.description}</p>
                </div>
                <span
                  className={`self-start rounded-full border px-3 py-1 text-xs font-semibold md:self-center ${statusColors[item.status] ?? "text-base-muted border-base-border/50"}`}
                >
                  {item.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card space-y-6 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
            Estado del proyecto
          </p>
          <h2 className="text-3xl font-semibold">
            Listo para demos en vivo, integraciones financieras y despliegue
            continuo
          </h2>
          <p className="text-base text-base-muted">
            La arquitectura, identidad visual y procesos descritos están
            implementados en el repo principal. Agendemos una revisión conjunta
            para alinear próximos hitos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="https://github.com/club-app/showcase"
              className="btn-primary px-6 py-3 text-base font-medium transition hover:translate-y-0.5"
              target="_blank"
            >
              Abrir repositorio
            </Link>
            <Link
              href="mailto:direccion@club.ar?subject=Showcase%20Club"
              className="rounded-full border border-base-border px-6 py-3 text-base font-medium text-base-muted transition hover:border-accent-primary hover:text-base-foreground"
            >
              Coordinar reunión
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
