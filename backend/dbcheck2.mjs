import { Client } from 'pg';
const c = new Client(process.env.DATABASE_URL);
c.connect().then(async () => {
  try {
    const t = await c.query("select tablename from pg_tables where schemanode='public' order by tablename");
    console.log('TABLES:', t.rows.map(r => r.tablename).join(', '));
    for (const tb of t.rows) {
      const cnt = await c.query('select count(*) as c from "' + tb.tablename + '"');
      console.log(tb.tablename, '=', cnt.rows[0].c);
    }
  } catch(e) {
    console.log('QUERY ERR:', e.message);
  }
  await c.end();
}).catch(e => { console.log('CONNECT ERR:', e.message); });