import { chromium, type FullConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export default async function globalSetup(config: FullConfig) {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Debes definir E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para generar el storage state de Playwright.",
    );
  }

  const storagePath = resolve(process.cwd(), "e2e/.auth/admin.json");
  mkdirSync(dirname(storagePath), { recursive: true });

  const defaultBaseUrl = "http://127.0.0.1:3000";
  const projectBaseURL = config.projects[0]?.use?.baseURL;
  const baseURL = process.env.E2E_BASE_URL ?? projectBaseURL ?? defaultBaseUrl;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/auth/signin`);
  const heading = page.locator("h1");
  const headingText = (await heading.textContent())?.trim();
  if (headingText?.includes("Configurar administrador")) {
    throw new Error(
      "El entorno E2E no tiene un administrador configurado. Ejecutá `npm run seed:admin` antes de correr Playwright.",
    );
  }

  await page.fill("#login-email", adminEmail);
  await page.fill("#login-password", adminPassword);
  await page.click("button:has-text('Ingresar')");
  await page.waitForURL(/\/admin(\?.*)?$/i, { timeout: 15_000 });

  await page.context().storageState({ path: storagePath });
  await browser.close();
}
