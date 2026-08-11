const { Pool } = require('pg');
require('dotenv').config({ path: 'D:/BizIntel/ps05-enterprise-intelligence/backend/.env' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const del = await p.query(`DELETE FROM users WHERE lower(email) = 'dev@ps05.local'`);
  console.log('deleted:', del.rowCount);
  await p.end();
}
main().catch((e) => {
  console.error('ERR', e.message);
  return p.end();
});
