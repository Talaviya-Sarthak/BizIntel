import {
  createPool,
  getAppliedMigrations,
  getMigrationFiles,
} from './migration-utils';

async function main(): Promise<void> {
  const pool = createPool();
  const migrations = getMigrationFiles();

  const applied = await getAppliedMigrations(pool);
  const appliedByVersion = new Map(applied.map((m) => [m.version, m]));

  console.log('Migration status\n');
  console.log('  VERSION  STATUS   NAME');
  console.log('  -------  ------   ----');

  for (const migration of migrations) {
    const record = appliedByVersion.get(migration.version);
    if (record) {
      const integrity =
        record.checksum === migration.checksum ? '' : '  [CHECKSUM MISMATCH]';
      console.log(
        `  ${String(migration.version).padEnd(7)}  applied  ${migration.name}${integrity}`,
      );
    } else {
      console.log(
        `  ${String(migration.version).padEnd(7)}  pending  ${migration.name}`,
      );
    }
  }

  const pendingCount = migrations.filter((m) => !appliedByVersion.has(m.version)).length;
  console.log(
    `\n${migrations.length} migration(s) found, ${applied.length} applied, ${pendingCount} pending.`,
  );

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
