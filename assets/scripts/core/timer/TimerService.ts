import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';
import type { TimerHandle } from './TimerHandle';

interface InternalTimerEntry {
  readonly id: number;
  readonly kind: 'timeout' | 'interval';
  readonly nativeId: number;
  active: boolean;
}

export class TimerService {
  private readonly logger: Logger;
  private readonly entries = new Map<number, InternalTimerEntry>();
  private nextId = 1;

  public constructor(logger: Logger) {
    this.logger = logger;
  }

  public scheduleOnce(delaySeconds: number, callback: () => void): TimerHandle {
    this.assertDelay(delaySeconds);

    const id = this.nextId++;
    const nativeId = setTimeout(() => {
      const entry = this.entries.get(id);
      if (!entry || !entry.active) {
        return;
      }
      entry.active = false;
      this.entries.delete(id);
      callback();
    }, Math.floor(delaySeconds * 1000)) as unknown as number;

    const entry: InternalTimerEntry = {
      id,
      kind: 'timeout',
      nativeId,
      active: true,
    };
    this.entries.set(id, entry);

    return this.createHandle(id);
  }

  public scheduleInterval(intervalSeconds: number, callback: () => void): TimerHandle {
    this.assertDelay(intervalSeconds);

    const id = this.nextId++;
    const nativeId = setInterval(() => {
      const entry = this.entries.get(id);
      if (!entry || !entry.active) {
        return;
      }
      callback();
    }, Math.floor(intervalSeconds * 1000)) as unknown as number;

    const entry: InternalTimerEntry = {
      id,
      kind: 'interval',
      nativeId,
      active: true,
    };
    this.entries.set(id, entry);

    return this.createHandle(id);
  }

  public cancel(timerId: number): void {
    const entry = this.entries.get(timerId);
    if (!entry) {
      throw new FrameworkError({
        module: 'TimerService',
        code: 'TIMER_NOT_FOUND',
        message: `Timer '${timerId}' not found.`,
      });
    }

    if (!entry.active) {
      throw new FrameworkError({
        module: 'TimerService',
        code: 'TIMER_INACTIVE',
        message: `Timer '${timerId}' is already inactive.`,
      });
    }

    entry.active = false;
    if (entry.kind === 'interval') {
      clearInterval(entry.nativeId);
    } else {
      clearTimeout(entry.nativeId);
    }

    this.entries.delete(timerId);
  }

  public cancelAll(): void {
    for (const entry of this.entries.values()) {
      if (entry.kind === 'interval') {
        clearInterval(entry.nativeId);
      } else {
        clearTimeout(entry.nativeId);
      }
      entry.active = false;
    }
    this.entries.clear();
  }

  public dispose(): void {
    this.cancelAll();
    this.logger.info('TimerService', 'Timer service disposed.');
  }

  private createHandle(id: number): TimerHandle {
    const service = this;
    return {
      id,
      get active(): boolean {
        return service.entries.has(id);
      },
      dispose: () => {
        if (!service.entries.has(id)) {
          return;
        }
        service.cancel(id);
      },
    } as TimerHandle;
  }

  private assertDelay(delaySeconds: number): void {
    if (!Number.isFinite(delaySeconds) || delaySeconds < 0) {
      throw new FrameworkError({
        module: 'TimerService',
        code: 'INVALID_DELAY',
        message: `Timer delay must be >= 0. got ${delaySeconds}`,
      });
    }
  }
}
