import { expect, test } from "@playwright/test";

function generateTestMember() {
  const timestamp = Date.now();
  return {
    name: `QA Playwright ${timestamp}`,
    email: `qa-${timestamp}@club.test`,
    documentNumber: `DNI-${timestamp}`,
    phone: `+54${timestamp.toString().slice(-8)}`,
    address: `Calle Falsa ${timestamp % 1000}`,
    notes: "Generado automáticamente por las pruebas e2e",
    password: `Qa-${timestamp}-pw`,
  } as const;
}

function parseCurrency(valueText: string) {
  const sanitized = valueText.replace(/[^0-9,.-]/g, "");
  if (!sanitized) return 0;
  const normalized = sanitized.replace(/\./g, "").replace(/,/g, ".");
  return Number(normalized);
}

test.describe("Flujo crítico socio → inscripción → pago → reporte", () => {
  test("permite crear socio, inscribirlo, registrar un pago y ver KPIs", async ({ page }) => {
    const member = generateTestMember();

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Gestión de socios", exact: true })
    ).toBeVisible();

    await page.getByRole("button", { name: "+ Nuevo socio" }).click();
    await page.getByLabel("Nombre completo").fill(member.name);
    await page.getByLabel("Correo").fill(member.email);
    await page.getByLabel("Documento").fill(member.documentNumber);
    await page.getByLabel("Teléfono").fill(member.phone);
    await page.getByLabel("Dirección").fill(member.address);
    await page.getByLabel("Fecha de nacimiento").fill("1990-01-01");
    await page.getByLabel("Estado").selectOption("ACTIVE");
    await page.getByLabel("Contraseña").fill(member.password);
    await page.getByLabel("Notas").fill(member.notes);
    await page.getByRole("button", { name: "Crear socio" }).click();

    await expect(page.getByText("Socio creado correctamente.", { exact: false })).toBeVisible();
    await expect(page.getByText(member.email)).toBeVisible();

    const memberResponse = await page.request.get(
      `/api/socios?search=${encodeURIComponent(member.email)}`
    );
    const memberPayload = (await memberResponse.json()) as {
      data: Array<{ id: string; email: string }>;
    };
    const memberId = memberPayload.data.find((item) => item.email === member.email)?.id;
    expect(memberId, "El socio creado debe existir en la API").toBeTruthy();

    await page.goto("/admin/inscripciones");
    await expect(
      page.getByRole("heading", {
        name: "Inscripciones y cuotas",
        exact: true,
      })
    ).toBeVisible();

    await page.getByRole("button", { name: "+ Nueva inscripción" }).click();
    await page.getByLabel("Socio").selectOption(memberId!);
    const planName = `Plan QA ${new Date().getFullYear()}`;
    await page.getByLabel("Nombre del plan (opcional)").fill(planName);
    await page.getByLabel("Monto mensual").fill("15000");
    await page.getByLabel("Cantidad de cuotas").fill("1");
    await page.getByLabel("Notas (opcional)").fill("Alta generada por Playwright");
    await page.getByRole("button", { name: "Crear inscripción" }).click();

    await expect(
      page.getByText("Inscripción creada correctamente.", { exact: false })
    ).toBeVisible();

    await page.getByLabel("ID de socio").fill(memberId!);
    await page.waitForTimeout(500);
    const dueRow = page.getByRole("row", { name: new RegExp(member.documentNumber) }).first();
    await expect(dueRow).toBeVisible();
    await dueRow.getByRole("button", { name: /Pago manual|Editar pago/ }).click();
    await page.getByRole("button", { name: "Registrar pago manual" }).click();
    await expect(
      page.getByText("Pago manual registrado correctamente.", { exact: false })
    ).toBeVisible();

    await page.goto("/admin/reportes");
    await expect(
      page.getByRole("heading", { name: "Reportes y métricas", exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("No encontramos datos para los filtros seleccionados.").first()
    ).toHaveCount(0);

    const revenueCard = page.locator("article", { hasText: "Ingresos cobrados" }).first();
    await expect(revenueCard).toBeVisible();
    const valueText = (await revenueCard.locator("p").nth(1).innerText()).trim();
    const revenueValue = parseCurrency(valueText);
    expect(revenueValue).toBeGreaterThan(0);
  });
});
