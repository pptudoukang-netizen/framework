import { LogLevel } from './LogLevel';
import type { Logger } from './Logger';

export class ConsoleLogger implements Logger {
  private readonly level: LogLevel;

  public constructor(level: LogLevel = LogLevel.Debug) {
    this.level = level;
  }

  public debug(module: string, message: string, details?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Debug) {
      console.debug(this.format(module, message), details ?? '');
    }
  }

  public info(module: string, message: string, details?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Info) {
      console.info(this.format(module, message), details ?? '');
    }
  }

  public warn(module: string, message: string, details?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Warn) {
      console.warn(this.format(module, message), details ?? '');
    }
  }

  public error(module: string, message: string, details?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Error) {
      console.error(this.format(module, message), details ?? '');
    }
  }

  private format(module: string, message: string): string {
    const now = new Date().toISOString();
    return `[${now}] [${module}] ${message}`;
  }
}