import { sql } from "drizzle-orm";

import "../src/lib/env";
import { db } from "../src/db/client";

async function main() {
  const { rows } = await db.execute(
    sql`
      select member_id, count(*) as total
      from enrollments
      group by member_id
      having count(*) > 1
    `,
  );

  if (rows.length === 0) {
    console.info("✅ No se encontraron inscripciones duplicadas por socio.");
    return;
  }

  console.warn("⚠️ Se detectaron inscripciones duplicadas:\n");
  for (const row of rows) {
    console.warn(`- member_id=${row.member_id} total=${row.total}`);
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
