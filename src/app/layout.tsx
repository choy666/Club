import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

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
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-base-border/60 bg-base-secondary/70 px-6 py-8 text-sm text-base-muted">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  © {new Date().getFullYear()} Club · Plataforma institucional
                </p>
                <div className="flex items-center gap-4 text-base-foreground">
                  <Link
                    href="/showcase"
                    className="text-sm font-medium text-base-foreground transition hover:text-accent-primary"
                  >
                    Ver showcase del proyecto
                  </Link>
                  <span className="text-xs uppercase tracking-[0.3em] text-base-muted">
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
