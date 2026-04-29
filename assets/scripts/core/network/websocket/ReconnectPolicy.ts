import type { ReconnectConfig } from '../NetworkConfig';

export class ReconnectPolicy {
  private readonly config: ReconnectConfig;

  public constructor(config: ReconnectConfig) {
    this.config = config;
  }

  public shouldRetry(attempt: number): boolean {
    return attempt < this.config.maxAttempts;
  }

  public getDelayMs(attempt: number): number {
    const raw = this.config.initialDelayMs * Math.pow(this.config.backoffFactor, attempt);
    return Math.min(this.config.maxDelayMs, Math.floor(raw));
  }
}