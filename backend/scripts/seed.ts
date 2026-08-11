import fs from 'node:fs';
import path from 'node:path';
import { createPool, REPO_ROOT } from './migration-utils';

/**
 * Applies `database/seed.sql` (development-only demo data).
 * The seed is idempotent, so it is safe to run multiple times.
 */
async function main(): Promise<void> {
  const seedPath = path.join(REPO_ROOT, 'database', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  const pool = createPool();
  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    console.log('Seed data applied successfully.');
  } catch (error) {
    await pool.query('ROLLBACK');
    const message = error instanceof Error ? error.message : String(error);
    console.error('Seed data failed and was rolled back.');
    console.error(message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
