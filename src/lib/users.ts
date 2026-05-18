import { sql } from "./db";

export async function getActiveMemberCount() {
  const rows = (await sql()`
    SELECT count(*)::int AS count
    FROM users
    WHERE is_active = true
  `) as Array<{ count: number }>;

  return rows[0]?.count ?? 0;
}
