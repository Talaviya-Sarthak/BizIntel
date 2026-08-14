import { getMigrationFiles, REPO_ROOT, SCHEMA_MIGRATIONS_TABLE_SQL } from './migration-utils.js';

/**
 * Regenerates `database/schema.sql` from the migration files.
 *
 * schema.sql = "complete current database state" snapshot, while the
 * migrations directory = "history". After every migration change, run
 * `npm run db:schema` and commit the regenerated snapshot.
 */
function main(): void {
  const migrations = getMigrationFiles();

  if (migrations.length === 0) {
    console.error('No migrations found.');
    process.exit(1);
  }

  const rows = migrations
    .map(
      (m) => `  (${m.version}, '${m.name}', '${m.checksum}')`,
    )
    .join(',\n');

  const bodies = migrations.map((m) => m.sql.trim()).join('\n\n');

  const schema = `-- =============================================================================
-- schema.sql — PS-05 Enterprise Intelligence Platform
--
-- GENERATED FILE. Do not edit by hand.
-- Represents the COMPLETE CURRENT DATABASE STATE (all migrations applied).
--
-- Regenerate after migration changes with:
--     npm run db:schema
--
-- Create a fresh database from scratch:
--     psql "$DATABASE_URL" -f database/schema.sql
-- =============================================================================

BEGIN;

-- Migration tracking (applied-migration registry)
${SCHEMA_MIGRATIONS_TABLE_SQL.trim()}

-- -----------------------------------------------------------------------------
-- Migrations (applied in order)
-- -----------------------------------------------------------------------------
${bodies}

-- Record that all migrations are applied so npm run db:status reports
-- the database as fully migrated.
INSERT INTO schema_migrations (version, name, checksum) VALUES
${rows}
ON CONFLICT (version) DO NOTHING;

COMMIT;
`;

  const outputPath = `${REPO_ROOT}/database/schema.sql`;
  const fs = require('node:fs');
  fs.writeFileSync(outputPath, schema, 'utf8');
  console.log(`Regenerated ${outputPath} from ${migrations.length} migration(s).`);
}

main();
