import {
  applyMigration,
  createPool,
  getAppliedMigrations,
  getMigrationFiles,
} from './migration-utils.js';

async function main(): Promise<void> {
  const pool = createPool();
  const migrations = getMigrationFiles();

  const applied = await getAppliedMigrations(pool);
  const appliedByVersion = new Map(applied.map((m) => [m.version, m]));

  const pending = migrations.filter((m) => !appliedByVersion.has(m.version));

  // Integrity check: an applied migration must not have changed on disk.
  for (const migration of migrations) {
    const record = appliedByVersion.get(migration.version);
    if (record && record.checksum !== migration.checksum) {
      console.warn(
        `⚠️  Warning: applied migration "${migration.name}" checksum does not match the file on disk. ` +
          `An applied migration should never be rewritten.`,
      );
    }
  }

  if (pending.length === 0) {
    console.log('Database is up to date. No pending migrations.');
    await pool.end();
    return;
  }

  console.log(`Applying ${pending.length} migration(s)...\n`);

  const client = await pool.connect();
  try {
    for (const migration of pending) {
      const started = Date.now();
      await applyMigration(client, migration);
      const elapsed = Date.now() - started;
      console.log(`✔ ${migration.name}  (${elapsed}ms)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nMigration failed. Transaction rolled back.`);
    console.error(message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\nAll pending migrations applied successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
