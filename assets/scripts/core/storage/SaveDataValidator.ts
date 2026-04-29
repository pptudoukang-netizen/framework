import { FrameworkError } from '../error/FrameworkError';
import type { SaveData } from './SaveData';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class SaveDataValidator {
  public static validate(data: unknown): asserts data is SaveData {
    if (!isObject(data)) {
      throw new FrameworkError({
        module: 'SaveDataValidator',
        code: 'INVALID_SHAPE',
        message: 'SaveData must be an object.',
      });
    }

    if (typeof data.version !== 'number' || !Number.isInteger(data.version) || data.version <= 0) {
      throw new FrameworkError({
        module: 'SaveDataValidator',
        code: 'INVALID_VERSION',
        message: 'SaveData.version must be a positive integer.',
      });
    }

    const requiredSections = ['player', 'bag', 'level', 'shop', 'task', 'guide'];
    for (const section of requiredSections) {
      if (!isObject(data[section])) {
        throw new FrameworkError({
          module: 'SaveDataValidator',
          code: 'MISSING_SECTION',
          message: `SaveData section '${section}' is missing or invalid.`,
        });
      }
    }
  }
}