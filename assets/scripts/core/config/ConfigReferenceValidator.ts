import { FrameworkError } from '../error/FrameworkError';
import type { ConfigManifest } from './ConfigManifest';
import type { ConfigTable } from './ConfigTable';

export class ConfigReferenceValidator {
  public static validate<TRecord extends Record<string, unknown>>(
    manifest: ConfigManifest<TRecord>,
    table: ConfigTable<TRecord, string | number>,
    getTable: (name: string) => ConfigTable<Record<string, unknown>, string | number>,
  ): void {
    if (!manifest.references || manifest.references.length === 0) {
      return;
    }

    for (const reference of manifest.references) {
      const targetTable = getTable(reference.targetTable);
      const targetField = reference.targetField ?? 'id';

      for (const row of table.getAll()) {
        const value = row[reference.field as keyof TRecord];
        if (value === undefined || value === null) {
          throw new FrameworkError({
            module: 'ConfigReferenceValidator',
            code: 'MISSING_REFERENCE_FIELD',
            message: `Reference field '${reference.field}' is missing in table '${manifest.name}'.`,
          });
        }

        if (targetField === 'id') {
          if (!targetTable.has(value as string | number)) {
            throw new FrameworkError({
              module: 'ConfigReferenceValidator',
              code: 'BROKEN_REFERENCE',
              message: `Broken reference '${manifest.name}.${reference.field}' -> '${reference.targetTable}'.`,
            });
          }
          continue;
        }

        const exists = targetTable.getAll().some((targetRow) => targetRow[targetField] === value);
        if (!exists) {
          throw new FrameworkError({
            module: 'ConfigReferenceValidator',
            code: 'BROKEN_REFERENCE',
            message: `Broken reference '${manifest.name}.${reference.field}' -> '${reference.targetTable}.${targetField}'.`,
          });
        }
      }
    }
  }
}