"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

import { clientLogger } from "@/lib/client-logger";

type Status = "loading" | "needs-admin" | "ready";

type Feedback = {
  type: "success" | "error";
  message: string;
};

function getLoginErrorMessage(code?: string) {
  if (!code) {
    return "No se pudo iniciar sesión. Intentá nuevamente.";
  }

  const normalizedCode = code.toLowerCase();

  if (normalizedCode.includes("configuration")) {
    return "Hubo un problema con la configuración de autenticación. Revisá las variables NEXTAUTH_URL y NEXTAUTH_SECRET en el servidor.";
  }

  if (normalizedCode.includes("credentialssignin") || normalizedCode.includes("credentials")) {
    return "Credenciales inválidas. Verificá el correo y la contraseña ingresados.";
  }

  return code;
}

async function getAdminStatus() {
  const response = await fetch("/api/admin/status");
  if (!response.ok) {
    throw new Error("No se pudo verificar el estado del administrador.");
  }
  const data = (await response.json()) as { hasAdmin: boolean };
  return data.hasAdmin;
}

export default function SignInPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    getAdminStatus()
      .then((hasAdmin) => setStatus(hasAdmin ? "ready" : "needs-admin"))
      .catch((error) => {
        clientLogger.error("No se pudo verificar estado admin", error);
        setFeedback({
          type: "error",
          message: "No se pudo verificar el estado del administrador. Intenta recargar.",
        });
      });
  }, []);

  async function handleCreateAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPassword !== createPasswordConfirm) {
      setFeedback({
        type: "error",
        message: "Las contraseñas no coinciden.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          name: createName || undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          (errorBody as { message?: string })?.message ?? "No se pudo crear el administrador."
        );
      }

      setStatus("ready");
      setLoginEmail(createEmail.toLowerCase());
      setLoginPassword("");
      setFeedback({
        type: "success",
        message:
          "Administrador creado correctamente. Usá las credenciales definidas para iniciar sesión.",
      });
    } catch (error) {
      clientLogger.error("Error creando admin inicial", error);
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo crear el administrador.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
        callbackUrl: "/admin",
      });

      if (!result || result.error) {
        const fallbackMessage = getLoginErrorMessage(result?.error);
        setFeedback({
          type: "error",
          message: fallbackMessage,
        });
        setIsSubmitting(false);
        return;
      }

      window.location.href = result.url ?? "/admin";
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? getLoginErrorMessage(error.message)
            : "No se pudo iniciar sesión.",
      });
      setIsSubmitting(false);
    }
  }

  const showCreateForm = status === "needs-admin";

  return (
    <main className="min-h-screen bg-base-primary text-base-foreground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg glass-card p-8 space-y-6">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-base-muted">Club · Gestión</p>
          <h1 className="text-3xl font-semibold font-[var(--font-space)]">
            {showCreateForm ? "Configurar administrador inicial" : "Iniciar sesión"}
          </h1>
          <p className="text-base text-muted">
            {showCreateForm
              ? "Generá el único usuario administrador del sistema. Guardá las credenciales con seguridad: serán necesarias para cualquier acceso futuro."
              : "Ingresá con tus credenciales para acceder al panel administrativo."}
          </p>
        </header>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-state-active text-state-active"
                : "border-accent-critical text-accent-critical"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {status === "loading" ? (
          <p className="text-center text-sm text-muted animate-pulse">
            Verificando estado del administrador...
          </p>
        ) : showCreateForm ? (
          <form className="space-y-4" onSubmit={handleCreateAdmin}>
            <div className="space-y-2">
              <label className="text-sm text-muted" htmlFor="create-name">
                Nombre (opcional)
              </label>
              <input
                id="create-name"
                type="text"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                className="w-full rounded-xl border border-base-border bg-base-secondary px-4 py-3 focus:border-accent-primary focus:outline-none"
                placeholder="Ej: Administrador General"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted" htmlFor="create-email">
                Correo institucional
              </label>
              <input
                id="create-email"
                type="email"
                required
                value={createEmail}
                onChange={(event) => setCreateEmail(event.target.value)}
                className="w-full rounded-xl border border-base-border bg-base-secondary px-4 py-3 focus:border-accent-primary focus:outline-none"
                placeholder="admin@club.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted" htmlFor="create-password">
                  Contraseña
                </label>
                <input
                  id="create-password"
                  type="password"
                  required
                  minLength={8}
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  className="w-full rounded-xl border border-base-border bg-base-secondary px-4 py-3 focus:border-accent-primary focus:outline-none"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted" htmlFor="create-password-confirm">
                  Confirmar contraseña
                </label>
                <input
                  id="create-password-confirm"
                  type="password"
                  required
                  value={createPasswordConfirm}
                  onChange={(event) => setCreatePasswordConfirm(event.target.value)}
                  className="w-full rounded-xl border border-base-border bg-base-secondary px-4 py-3 focus:border-accent-primary focus:outline-none"
                  placeholder="Repetí la contraseña"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full text-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear administrador"}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm text-muted" htmlFor="login-email">
                Correo
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="w-full rounded-xl border border-base-border bg-base-secondary px-4 py-3 focus:border-accent-primary focus:outline-none"
                placeholder="admin@club.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted" htmlFor="login-password">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="w-full rounded-xl border border-base-border bg-base-secondary px-4 py-3 focus:border-accent-primary focus:outline-none"
                placeholder="Tu contraseña"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full text-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
