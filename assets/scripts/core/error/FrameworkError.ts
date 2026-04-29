export interface FrameworkErrorOptions {
  module: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class FrameworkError extends Error {
  public readonly module: string;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  public constructor(options: FrameworkErrorOptions) {
    super(`[${options.module}:${options.code}] ${options.message}`);
    this.name = 'FrameworkError';
    this.module = options.module;
    this.code = options.code;
    this.details = options.details;

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }

  public static fromUnknown(
    module: string,
    code: string,
    message: string,
    error: unknown,
    details?: Record<string, unknown>,
  ): FrameworkError {
    if (error instanceof FrameworkError) {
      return error;
    }

    return new FrameworkError({
      module,
      code,
      message,
      details: {
        ...details,
        originalError: error instanceof Error ? error.message : String(error),
      },
      cause: error,
    });
  }
}