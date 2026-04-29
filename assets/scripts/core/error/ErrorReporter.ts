import { FrameworkError } from './FrameworkError';
import type { Logger } from '../logger/Logger';

export interface ErrorReporter {
  report(error: unknown, context?: Record<string, unknown>): void;
}

export class ConsoleErrorReporter implements ErrorReporter {
  private readonly logger: Logger;

  public constructor(logger: Logger) {
    this.logger = logger;
  }

  public report(error: unknown, context?: Record<string, unknown>): void {
    if (error instanceof FrameworkError) {
      this.logger.error(error.module, error.message, {
        code: error.code,
        details: error.details,
        context,
      });
      return;
    }

    if (error instanceof Error) {
      this.logger.error('UnknownError', error.message, {
        stack: error.stack,
        context,
      });
      return;
    }

    this.logger.error('UnknownError', 'Non-Error value thrown', {
      thrown: String(error),
      context,
    });
  }
}