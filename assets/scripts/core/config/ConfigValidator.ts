import { FrameworkError } from '../error/FrameworkError';
import type { ConfigManifest } from './ConfigManifest';

export class ConfigValidator {
  public static validateRows<TRecord extends Record<string, unknown>>(
    manifest: ConfigManifest<TRecord>,
    rows: readonly TRecord[],
  ): void {
    const seenIds = new Set<string | number>();

    for (const row of rows) {
      for (const field of manifest.requiredFields) {
        if (!(field in row)) {
          throw new FrameworkError({
            module: 'ConfigValidator',
            code: 'MISSING_FIELD',
            message: `Missing required field '${field}' in config '${manifest.name}'.`,
          });
        }

        const value = row[field];
        if (value === undefined || value === null) {
          throw new FrameworkError({
            module: 'ConfigValidator',
            code: 'NULL_FIELD',
            message: `Required field '${field}' is null/undefined in config '${manifest.name}'.`,
          });
        }
      }

      const idValue = row[manifest.idField] as string | number;
      if (typeof idValue !== 'string' && typeof idValue !== 'number') {
        throw new FrameworkError({
          module: 'ConfigValidator',
          code: 'INVALID_ID_TYPE',
          message: `Invalid id type in config '${manifest.name}'.`,
        });
      }

      if (seenIds.has(idValue)) {
        throw new FrameworkError({
          module: 'ConfigValidator',
          code: 'DUPLICATE_ID',
          message: `Duplicate id '${String(idValue)}' in config '${manifest.name}'.`,
        });
      }

      seenIds.add(idValue);
    }
  }
}