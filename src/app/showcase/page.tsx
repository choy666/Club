import Link from "next/link";
import type { Metadata } from "next";

const benefitBlocks = [
  {
    title: "Gestión total de socios",
    description:
      "Padrones vivos, segmentación y documentación centralizada para áreas de administración, deportes y comunicación.",
    points: [
      "Altas/bajas versionadas con Drizzle y validaciones server-side.",
      "Roles administrativos, staff y entrenadores gestionados con NextAuth v5.",
    ],
  },
  {
    title: "Automatización financiera",
    description:
      "Cuotas, planes y recordatorios operan sin planillas paralelas ni correos manuales.",
    points: [
      "Jobs orquestados con React Query mutan estados y disparan notificaciones.",
      "economic_configs vincula tarifas, vencimientos y promociones.",
    ],
  },
  {
    title: "Monitoreo de morosidad",
    description:
      "Paneles de deuda, aging por segmento y acciones sugeridas para recuperar ingresos.",
    points: [
      "Filtros dinámicos para comité financiero y gerencia deportiva.",
      "Alertas automáticas para socios críticos vía hooks y tags.",
    ],
  },
  {
    title: "Seguridad y permisos",
    description:
      "Gobernanza basada en roles, bitácoras y controles por ambiente.",
    points: [
      "NextAuth + middleware protegen `/admin`, `/staff` y APIs internas.",
      "Observabilidad: trazas de actividad y feature flags auditables.",
    ],
  },
];

const benefitMetrics = [
  {
    label: "Flujos automatizados",
    value: "15+",
    detail: "Alta, inscripción, cuotas, recordatorios y conciliaciones vivas.",
  },
  {
    label: "Integraciones productivas",
    value: "Neon + NextAuth",
    detail: "Stack desplegado y operando sin mockups.",
  },
  {
    label: "Tiempo de setup",
    value: "< 30 min",
    detail: "`scripts/reset-admin` + seeds QA listos para correr.",
  },
  {
    label: "Disponibilidad",
    value: "99.9%",
    detail: "Vercel + monitor Neon y alertas en tiempo real.",
  },
];

const workflowSteps = [
  {
    stage: "Alta de socio",
    value:
      "Capturamos datos, documentos y consentimientos en un solo flujo guiado.",
    tech: "Formularios controlados + API `/api/members` con Drizzle y validaciones Zod.",
  },
  {
    stage: "Inscripción a actividades",
    value:
      "Asignación de planes, cupos y beneficios según disciplina o categoría.",
    tech: "Servicios `/api/enrollments` y catálogos cacheados con React Query.",
  },
  {
    stage: "Emisión de cuotas",
    value:
      "Cuotas mensuales, trimestrales u ocasionales ligadas a economic_configs.",
    tech: "Jobs parametrizados, estados en Neon y mutaciones optimistas.",
  },
  {
    stage: "Pagos y conciliación",
    value:
      "Pagos Mercado Pago, estados sincronizados y alertas de morosidad inmediata.",
    tech: "Webhooks + conciliador interno con React Query y hooks server-side.",
  },
  {
    stage: "Reportes ejecutivos",
    value:
      "Reportes de deuda, recaudo, retención y proyección listos para comité.",
    tech: "Dashboards SSR + streaming y endpoints agregados protegidos.",
  },
];

const scalabilityHighlights = [
  {
    title: "Neon serverless + Drizzle",
    detail:
      "Migraciones versionadas, branching y seeds QA reproducibles para cada sprint.",
  },
  {
    title: "Next.js App Router",
    detail:
      "Layouts privados, streaming y caching selectivo para paneles críticos.",
  },
  {
    title: "React Query + feature flags",
    detail:
      "Actualizaciones optimistas y toggles basados en economic_configs para activar módulos por club.",
  },
  {
    title: "Tooling operativo",
    detail:
      "Scripts `seed-admin` y `reset-admin`, pipelines QA y monitoreo continuo.",
  },
];

const strengths = [
  {
    title: "Seguridad aplicada",
    description:
      "NextAuth v5, roles jerárquicos, middlewares y logs en endpoints sensibles.",
  },
  {
    title: "Time-to-market acelerado",
    description:
      "Migraciones y seeds versionados permiten levantar ambientes en minutos.",
  },
  {
    title: "Personalización financiera",
    description:
      "economic_configs habilita planes diferenciales, becas y convenios locales.",
  },
  {
    title: "Soporte QA continuo",
    description:
      "Checklists, ambiente QA y suites de smoke test documentadas en el repo.",
  },
];

const onboardingSteps = [
  {
    title: "Configura `.env`",
    detail:
      "Completa claves de Neon, NextAuth, providers OAuth y secrets de correo.",
  },
  {
    title: "Corre las migraciones",
    detail: "Aplica `drizzle-kit push` para dejar Neon alineado al schema.",
    command: "npm run db:push",
  },
  {
    title: "Seed de administradores",
    detail: "Ejecuta `scripts/seed-admin.ts` para crear cuentas operativas.",
    command: "npm run seed:admin",
  },
  {
    title: "Levanta el entorno",
    detail: "Inicia el panel para pruebas funcionales y demos guiadas.",
    command: "npm run dev",
  },
];

const docsLinks = [
  {
    label: "README general",
    href: "https://github.com/club-app/showcase/blob/main/README.md",
  },
  {
    label: "Identidad visual",
    href: "https://github.com/club-app/showcase/blob/main/docs/identidadVisual.md",
  },
  {
    label: "Contratos API",
    href: "https://github.com/club-app/showcase/blob/main/docs/implementShowcase.md",
  },
];

const roadmap = [
  {
    title: "Sprint 4 · Pagos y conciliación",
    status: "En curso",
    date: "Feb 2026",
    description:
      "Webhooks Mercado Pago, conciliador interno y alertas automáticas por morosidad.",
  },
  {
    title: "Sprint 5 · Reportes y monitoreo",
    status: "Planeado",
    date: "Mar 2026",
    description:
      "Dashboards comparativos, cohortes, proyecciones y alertas ejecutivas.",
  },
  {
    title: "Sprint 6 · Portal socio mobile",
    status: "Planeado",
    date: "Abr 2026",
    description:
      "Experiencia móvil con credenciales digitales y notificaciones segmentadas.",
  },
];

const statusColors: Record<string, string> = {
  Live: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  "En progreso": "text-amber-300 border-amber-500/40 bg-amber-500/10",
  "En curso": "text-amber-300 border-amber-500/40 bg-amber-500/10",
  Planeado: "text-slate-300 border-slate-600/50 bg-slate-600/10",
};

export const metadata: Metadata = {
  title: "Showcase · AppClub",
  description:
    "Portada comercial de AppClub: plataforma integral para clubes, con flujos listos, seeds QA y roadmap activo.",
};

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-base-primary px-6 py-12 text-base-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <section className="relative overflow-hidden rounded-3xl border border-base-border/80 bg-[radial-gradient(circle_at_top,_rgba(198,40,40,0.3),_rgba(3,7,18,0.6))] p-10 text-center shadow-2xl shadow-black/40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col gap-6">
            <span className="text-sm uppercase tracking-[0.35em] text-base-muted">
              AppClub · Portada comercial
            </span>
            <h1 className="text-4xl font-semibold sm:text-5xl">
              AppClub: la plataforma integral para clubes y organizaciones
              deportivas
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-base-muted">
              Unificamos socios, inscripciones, cuotas, pagos y reportes en un
              solo panel. Listo para demos comerciales, preventa técnica y
              despliegues rápidos.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="mailto:comercial@appclub.ar?subject=Demo%20AppClub"
                className="btn-primary px-6 py-3 text-base font-medium transition hover:translate-y-0.5"
              >
                Solicitar demo
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-base-border px-6 py-3 text-base font-medium text-base-muted transition hover:border-accent-primary hover:text-base-foreground"
              >
                Explorar panel
              </Link>
            </div>
            <p className="text-sm text-base-muted">
              Socios · Inscripciones · Cuotas · Pagos · Reportes
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Alcance y beneficios
            </p>
            <h2 className="text-3xl font-semibold">¿Qué obtiene tu club?</h2>
            <p className="text-base text-base-muted sm:max-w-3xl">
              Mantenemos la operación completa en un solo stack: datos vivos,
              automatizaciones financieras y seguridad granular para cada rol.
            </p>
          </header>
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="glass-card space-y-6 p-8">
              <h3 className="text-xl font-semibold">Bloques operativos</h3>
              <div className="grid gap-5 md:grid-cols-2">
                {benefitBlocks.map((block) => (
                  <article
                    key={block.title}
                    className="space-y-3 rounded-2xl border border-base-border/60 p-4"
                  >
                    <h4 className="text-lg font-semibold">{block.title}</h4>
                    <p className="text-sm text-base-muted">
                      {block.description}
                    </p>
                    <ul className="space-y-1 text-xs text-base-muted">
                      {block.points.map((point) => (
                        <li key={point}>• {point}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
            <div className="glass-card flex flex-col gap-4 p-8">
              <h3 className="text-xl font-semibold">Métricas destacadas</h3>
              {benefitMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-base-border/60 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-semibold">{metric.value}</p>
                  <p className="text-sm text-base-muted">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Funciones clave
            </p>
            <h2 className="text-3xl font-semibold">
              Workflow completo de negocio
            </h2>
          </header>
          <div className="relative pl-6">
            <span className="absolute left-3 top-0 h-full w-px bg-base-border/60" />
            <div className="space-y-8">
              {workflowSteps.map((step, index) => (
                <div key={step.stage} className="relative pl-8">
                  <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border border-accent-primary bg-accent-primary/20" />
                  <div className="glass-card space-y-3 p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
                      Paso {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-xl font-semibold">{step.stage}</h3>
                    <p className="text-sm text-base-muted">{step.value}</p>
                    <p className="text-xs font-mono text-accent-primary">
                      Stack · {step.tech}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Escalabilidad y tecnología
            </p>
            <h2 className="text-3xl font-semibold">
              Arquitectura preparada para crecer
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {scalabilityHighlights.map((item) => (
              <article key={item.title} className="glass-card space-y-2 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
                  {item.title}
                </p>
                <p className="text-base text-base-muted">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Fortalezas competitivas
            </p>
            <h2 className="text-3xl font-semibold">¿Por qué elegir AppClub?</h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {strengths.map((strength) => (
              <article
                key={strength.title}
                className="glass-card space-y-2 p-6"
              >
                <h3 className="text-xl font-semibold">{strength.title}</h3>
                <p className="text-sm text-base-muted">
                  {strength.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Consejos de uso
            </p>
            <h2 className="text-3xl font-semibold">Onboarding guiado</h2>
          </header>
          <div className="glass-card flex flex-col gap-6 p-8">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-2 rounded-2xl border border-base-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-base-muted">
                    Paso {index + 1}
                  </p>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-base-muted">{step.detail}</p>
                </div>
                {step.command ? (
                  <code className="mt-2 rounded-full border border-accent-primary/40 bg-accent-primary/5 px-4 py-1 text-xs text-accent-primary sm:mt-0">
                    {step.command}
                  </code>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap gap-4 text-sm text-base-muted">
              {docsLinks.map((doc) => (
                <Link
                  key={doc.label}
                  href={doc.href}
                  target="_blank"
                  className="rounded-full border border-base-border px-4 py-2 transition hover:border-accent-primary hover:text-base-foreground"
                >
                  {doc.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Plan futuro
            </p>
            <h2 className="text-3xl font-semibold">
              Roadmap vivo y entregables por sprint
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
            CTA final
          </p>
          <h2 className="text-3xl font-semibold">
            Resumen de valor: operación integral lista para producción
          </h2>
          <p className="text-base text-base-muted">
            AppClub combina infraestructura moderna, procesos ya automatizados y
            un roadmap claro. Coordinemos una demo para adaptar el panel a tu
            institución.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="mailto:comercial@clubos.ar?subject=Demo%20ClubOS"
              className="btn-primary px-6 py-3 text-base font-medium transition hover:translate-y-0.5"
            >
              Solicitar demo
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-base-border px-6 py-3 text-base font-medium text-base-muted transition hover:border-accent-primary hover:text-base-foreground"
            >
              Explorar panel
            </Link>
            <Link
              href="https://github.com/club-app/showcase"
              target="_blank"
              className="rounded-full border border-base-border px-6 py-3 text-base font-medium text-base-muted transition hover:border-accent-primary hover:text-base-foreground"
            >
              Ver repositorio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
