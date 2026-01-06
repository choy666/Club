import Link from "next/link";
import type { Metadata } from "next";

const benefitBlocks = [
  {
    title: "Gestión total de socios",
    description:
      "Administración completa de padrones con altas, bajas, edición y búsqueda instantánea.",
    points: [
      "Hasta 50,000 socios con rendimiento óptimo",
      "Búsqueda por nombre, DNI y estado en tiempo real",
      "Roles administrativos y permisos por área",
    ],
  },
  {
    title: "Inscripciones y actividades",
    description:
      "Control completo de inscripciones con estados, historial y credenciales digitales.",
    points: [
      "Hasta 75,000 inscripciones con paginación eficiente",
      "Estados automáticos: PENDIENTE/ACTIVA/CANCELADA",
      "Credenciales digitales con validación instantánea",
    ],
  },
  {
    title: "Cuotas y pagos inteligentes",
    description:
      "Sistema financiero completo con cuotas automáticas, pagos múltiples y control de morosidad.",
    points: [
      "Hasta 500,000 cuotas con filtros avanzados",
      "Pagos individuales y múltiples en un solo paso",
      "Estados automáticos: PENDIENTE/PAGADA/VENCIDA/CONGELADA",
    ],
  },
  {
    title: "Panel de administración intuitivo",
    description:
      "Interfaz amigable diseñada para administradores de club sin conocimientos técnicos.",
    points: [
      "Navegación simple con menús contextuales",
      "Feedback visual en cada operación",
      "Ayudas integradas y guías paso a paso",
    ],
  },
];

const benefitMetrics = [
  {
    label: "Socios gestionados",
    value: "50,000+",
    detail: "Capacidad probada para clubes grandes con rendimiento óptimo.",
  },
  {
    label: "Inscripciones activas",
    value: "75,000+",
    detail: "Control total de altas, bajas y estados históricos.",
  },
  {
    label: "Cuotas procesadas",
    value: "500,000+",
    detail: "Pagos individuales, múltiples y estados automáticos.",
  },
  {
    label: "Disponibilidad",
    value: "99.9%",
    detail: "Sistema estable y monitoreado para operación continua.",
  },
];

const workflowSteps = [
  {
    stage: "Alta de socio",
    value: "Registra nuevos socios con datos personales, documentos y asignación de credenciales.",
    features: "Formulario guiado, validación automática y creación de perfil en segundos.",
  },
  {
    stage: "Inscripción a actividades",
    value: "Inscribe socios en planes y actividades con control de cupos y beneficios.",
    features: "Selección de planes, fechas de inicio y generación automática de cuotas.",
  },
  {
    stage: "Gestión de cuotas",
    value: "Controla todas las cuotas mensuales con estados automáticos y recordatorios.",
    features: "Cuotas generadas automáticamente, seguimiento de pagos y alertas de vencimiento.",
  },
  {
    stage: "Procesamiento de pagos",
    value: "Registra pagos individuales o múltiples con diferentes métodos de pago.",
    features: "Pago en efectivo, transferencia o Mercado Pago con validación instantánea.",
  },
  {
    stage: "Reportes y control",
    value: "Accede a reportes de socios, inscripciones, cuotas y estado financiero.",
    features: "Paneles en tiempo real, filtros avanzados y exportación de datos.",
  },
];

const scalabilityHighlights = [
  {
    title: "Capacidad de socios",
    detail: "Hasta 50,000 socios con rendimiento óptimo y búsqueda instantánea.",
  },
  {
    title: "Gestión de inscripciones",
    detail: "75,000 inscripciones con control de estados y credenciales digitales.",
  },
  {
    title: "Procesamiento de cuotas",
    detail: "500,000 cuotas con pagos múltiples y filtros por fecha y estado.",
  },
  {
    title: "Rendimiento garantizado",
    detail: "Respuesta rápida (50ms-1.2s) y experiencia fluida para administradores.",
  },
];

const strengths = [
  {
    title: "Fácil de usar",
    description: "Interfaz intuitiva diseñada para administradores sin conocimientos técnicos.",
  },
  {
    title: "Operación completa",
    description: "Todas las funciones necesarias para gestionar tu club en un solo lugar.",
  },
  {
    title: "Escalabilidad probada",
    description: "Capacidad para manejar desde 1,000 hasta 50,000 socios sin problemas.",
  },
  {
    title: "Soporte continuo",
    description: "Documentación completa, guías y ayuda para implementación rápida.",
  },
];

const onboardingSteps = [
  {
    title: "Configura `.env`",
    detail: "Completa claves de Neon, NextAuth, providers OAuth y secrets de correo.",
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
              AppClub: La solución completa para administrar tu club
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-base-muted">
              Gestiona socios, inscripciones, cuotas y pagos en un solo panel. Diseñado para
              administradores de club, fácil de usar y escalable.
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
              ✅ 50,000 socios · ✅ 75,000 inscripciones · ✅ 500,000 cuotas · ✅ Fácil de usar
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
              Alcance y beneficios
            </p>
            <h2 className="text-3xl font-semibold">¿Qué puedes hacer con AppClub?</h2>
            <p className="text-base text-base-muted sm:max-w-3xl">
              Administra todo tu club desde un solo panel: socios, inscripciones, cuotas y pagos.
              Sin conocimientos técnicos, con interfaz intuitiva y soporte completo.
            </p>
          </header>
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="glass-card space-y-6 p-8">
              <h3 className="text-xl font-semibold">Funciones principales</h3>
              <div className="grid gap-5 md:grid-cols-2">
                {benefitBlocks.map((block) => (
                  <article
                    key={block.title}
                    className="space-y-3 rounded-2xl border border-base-border/60 p-4"
                  >
                    <h4 className="text-lg font-semibold">{block.title}</h4>
                    <p className="text-sm text-base-muted">{block.description}</p>
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
              <h3 className="text-xl font-semibold">Capacidad probada</h3>
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
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">Funciones clave</p>
            <h2 className="text-3xl font-semibold">Operación paso a paso</h2>
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
                      Características · {step.features}
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
            <h2 className="text-3xl font-semibold">Capacidad y escalabilidad</h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {scalabilityHighlights.map((item) => (
              <article key={item.title} className="glass-card space-y-2 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-base-muted">{item.title}</p>
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
            <h2 className="text-3xl font-semibold">Ventajas para tu club</h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {strengths.map((strength) => (
              <article key={strength.title} className="glass-card space-y-2 p-6">
                <h3 className="text-xl font-semibold">{strength.title}</h3>
                <p className="text-sm text-base-muted">{strength.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-base-muted">Consejos de uso</p>
            <h2 className="text-3xl font-semibold">Implementación sencilla</h2>
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

        <section className="glass-card space-y-6 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-base-muted">CTA final</p>
          <h2 className="text-3xl font-semibold">
            La solución completa para la administración de tu club
          </h2>
          <p className="text-base text-base-muted">
            AppClub está listo para usar hoy mismo, con capacidad probada y soporte continuo.
            Perfecto para clubes de cualquier tamaño que buscan organización y eficiencia.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="mailto:info@appclub.ar?subject=Demo%20AppClub"
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
              href="https://github.com/choy666/Club"
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
