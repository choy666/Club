import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import Link from "next/link";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Club · Gestión de socios",
  description:
    "Panel administrativo y portal de socios para gestionar inscripciones, cuotas y pagos del Club.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-base/primary" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-base/primary text-base/foreground`}
        suppressHydrationWarning
      >
        <AppProviders>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.2),_rgba(5,5,7,0.95)_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_0%,transparent_60%)] opacity-60" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:140px_140px]" />

            <div className="relative flex-1">{children}</div>

            <footer className="relative border-t border-white/10 px-6 py-10 text-sm text-base-muted backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-base-muted">
                    Plataforma institucional
                  </p>
                  <p className="text-base text-base-foreground">
                    © {new Date().getFullYear()} Club · Gestión integral de socios
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-base-foreground">
                  <Link
                    href="/socio"
                    className="rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.35em] transition hover:border-accent-primary hover:text-accent-primary"
                  >
                    Portal socio
                  </Link>
                  <Link
                    href="/showcase"
                    className="rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.35em] transition hover:border-accent-primary hover:text-accent-primary"
                  >
                    Showcase
                  </Link>
                  <span className="text-[0.6rem] uppercase tracking-[0.4em] text-base-muted">
                    Transparencia · Roadmap vivo
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
