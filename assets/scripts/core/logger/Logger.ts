export interface Logger {
  debug(module: string, message: string, details?: Record<string, unknown>): void;
  info(module: string, message: string, details?: Record<string, unknown>): void;
  warn(module: string, message: string, details?: Record<string, unknown>): void;
  error(module: string, message: string, details?: Record<string, unknown>): void;
}