require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
(async () => {
  const { data, error } = await sb.storage.listBuckets();
  if (error) { console.error('LIST_BUCKETS_ERROR:', error.message); process.exit(1); }
  for (const b of data) console.log('bucket:', b.name, b.public ? '(public)' : '(private)');
  const bucket = data.find((b) => b.name === (process.env.SUPABASE_DATAMART_BUCKET || 'datamart-datasets'));
  console.log('datamart-datasets exists:', Boolean(bucket));
  if (!bucket) process.exit(2);
})().catch((e) => { console.error(e.message); process.exit(1); });