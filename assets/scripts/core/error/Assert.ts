import { FrameworkError } from './FrameworkError';

export class Assert {
  public static notNull<T>(
    value: T | null | undefined,
    message: string,
    details?: Record<string, unknown>,
  ): T {
    if (value === null || value === undefined) {
      Assert.fail('ASSERT_NULL', message, details);
    }
    return value;
  }

  public static isTrue(
    condition: boolean,
    message: string,
    details?: Record<string, unknown>,
  ): void {
    if (!condition) {
      Assert.fail('ASSERT_FALSE', message, details);
    }
  }

  public static nonEmptyString(
    value: string,
    message: string,
    details?: Record<string, unknown>,
  ): string {
    if (!value || value.trim().length === 0) {
      Assert.fail('ASSERT_EMPTY_STRING', message, {
        ...details,
        value,
      });
    }
    return value;
  }

  public static validState(
    condition: boolean,
    stateName: string,
    message: string,
    details?: Record<string, unknown>,
  ): void {
    if (!condition) {
      Assert.fail('ASSERT_INVALID_STATE', `${message} (${stateName})`, details);
    }
  }

  public static fail(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ): never {
    throw new FrameworkError({
      module: 'Assert',
      code,
      message,
      details,
    });
  }
}