import { FrameworkError } from '../error/FrameworkError';
import type { SaveData } from './SaveData';
import type { SaveMigration } from './SaveMigration';

export class SaveMigrationPipeline {
  private readonly migrations = new Map<number, SaveMigration>();

  public register(migration: SaveMigration): void {
    if (this.migrations.has(migration.fromVersion)) {
      throw new FrameworkError({
        module: 'SaveMigrationPipeline',
        code: 'DUPLICATE_MIGRATION',
        message: `Migration from version ${migration.fromVersion} is already registered.`,
      });
    }

    this.migrations.set(migration.fromVersion, migration);
  }

  public migrate(data: SaveData, targetVersion: number): SaveData {
    if (data.version > targetVersion) {
      throw new FrameworkError({
        module: 'SaveMigrationPipeline',
        code: 'VERSION_AHEAD',
        message: `Save data version ${data.version} is ahead of target version ${targetVersion}.`,
      });
    }

    let current = data;
    const seen = new Set<number>();

    while (current.version < targetVersion) {
      if (seen.has(current.version)) {
        throw new FrameworkError({
          module: 'SaveMigrationPipeline',
          code: 'MIGRATION_LOOP',
          message: `Migration loop detected at version ${current.version}.`,
        });
      }
      seen.add(current.version);

      const migration = this.migrations.get(current.version);
      if (!migration) {
        throw new FrameworkError({
          module: 'SaveMigrationPipeline',
          code: 'MIGRATION_MISSING',
          message: `Missing migration path from version ${current.version} to ${targetVersion}.`,
        });
      }

      current = migration.migrate(current);
      current.version = migration.toVersion;
    }

    return current;
  }
}