import Link from "next/link";

const quickStats = [
  { label: "Socios activos", value: "284" },
  { label: "Cuotas pendientes", value: "$ 156.000" },
  { label: "Inscripciones hoy", value: "12" },
];

const quickActions = [
  { label: "Ver panel admin", href: "/admin" },
  { label: "Ingresar como socio", href: "/socio" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-base/primary text-base/foreground px-6 py-12 sm:px-12">
      <section className="max-w-5xl mx-auto space-y-12">
        <div className="glass-card p-10 flex flex-col gap-6">
          <span className="text-sm uppercase tracking-[0.3em] text-base-muted">
            CLUB · GESTIÓN
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[var(--font-space)] leading-tight">
            Control administrativo y acceso personalizado para cada socio.
          </h1>
          <p className="text-lg text-base-muted max-w-2xl">
            Plataforma unificada para inscripciones, cuotas, pagos y reportes.
            Diseñada para equipos administrativos exigentes y socios que
            necesitan claridad total sobre su estado.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin" className="btn-primary">
              Ir al panel admin
            </Link>
            <Link href="/socio" className="btn-secondary">
              Portal del socio
            </Link>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 space-y-2">
              <p className="text-sm uppercase tracking-widest text-base-muted">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-8 flex flex-col gap-4">
          <h2 className="text-2xl font-semibold font-[var(--font-space)]">
            Acciones rápidas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-xl border border-base-border px-6 py-4 hover:border-accent-primary transition-colors"
              >
                <span className="text-lg font-medium">{action.label}</span>
                <span className="text-base-muted text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
