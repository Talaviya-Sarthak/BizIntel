require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const r = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='datasets' ORDER BY ordinal_position");
  for (const row of r.rows) console.log(row.column_name, row.data_type);
  await p.end();
})().catch((e) => { console.error(e.message); process.exit(1); });