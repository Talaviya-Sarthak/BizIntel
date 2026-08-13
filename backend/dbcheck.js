const {Client} = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const t = await c.query("select tablename from pg_tables where schemaname='public' order by tablename");
  console.log('TABLES:', t.rows.map(r => r.tablename).join(', '));
  for (const tb of t.rows) {
    const cnt = await c.query('select count(*) as c from "' + tb.tablename + '"');
    console.log(tb.tablename, '=', cnt.rows[0].c);
  }
  await c.end();
}).catch(e => { console.log('ERR', e.message); process.exit(1); });