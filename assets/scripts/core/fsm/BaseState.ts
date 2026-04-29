import type { Logger } from '../logger/Logger';
import type { IState } from './IState';

export abstract class BaseState<TStateId extends string> implements IState<TStateId> {
  public abstract readonly id: TStateId;
  protected readonly logger: Logger;

  protected constructor(logger: Logger) {
    this.logger = logger;
  }

  public enter(_params?: unknown): Promise<void> | void {
    this.logger.debug('State', `Enter ${this.id}`);
  }

  public exit(): Promise<void> | void {
    this.logger.debug('State', `Exit ${this.id}`);
  }

  public update(_deltaTime: number): void {
    // Optional override in concrete states.
  }
}