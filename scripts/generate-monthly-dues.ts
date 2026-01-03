import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFiles = [".env.local", ".env"];

for (const file of envFiles) {
  const fullPath = resolve(process.cwd(), file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath, override: true });
  }
}

import { generateMonthlyDues } from "../src/lib/jobs/monthly-dues";

async function main() {
  const operator = process.argv[2]?.trim() || "manual";
  const result = await generateMonthlyDues(operator);

  console.info(
    `Job mensual completado. Procesadas: ${result.processedEnrollments}. ${result.notes} Operador: ${result.operator}.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
