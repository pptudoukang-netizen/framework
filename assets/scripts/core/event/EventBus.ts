import { FrameworkError } from '../error/FrameworkError';
import type { EventHandler, EventMapBase } from './EventTypes';
import type { EventSubscription } from './EventSubscription';

interface HandlerEntry<TPayload> {
  readonly handler: EventHandler<TPayload>;
  readonly once: boolean;
}

interface EventBusOptions<TEventMap extends EventMapBase> {
  allowedEvents?: readonly (keyof TEventMap)[];
}

export class EventBus<TEventMap extends EventMapBase> {
  private readonly handlers = new Map<keyof TEventMap, Set<HandlerEntry<unknown>>>();
  private readonly allowedEventSet?: Set<keyof TEventMap>;

  public constructor(options?: EventBusOptions<TEventMap>) {
    if (options?.allowedEvents) {
      this.allowedEventSet = new Set(options.allowedEvents);
    }
  }

  public on<K extends keyof TEventMap>(
    eventName: K,
    handler: EventHandler<TEventMap[K]>,
  ): EventSubscription {
    return this.subscribe(eventName, handler, false);
  }

  public once<K extends keyof TEventMap>(
    eventName: K,
    handler: EventHandler<TEventMap[K]>,
  ): EventSubscription {
    return this.subscribe(eventName, handler, true);
  }

  public off<K extends keyof TEventMap>(eventName: K, handler: EventHandler<TEventMap[K]>): void {
    this.assertEventAllowed(eventName);
    const entries = this.handlers.get(eventName);
    if (!entries) {
      return;
    }

    for (const entry of entries) {
      if (entry.handler === handler) {
        entries.delete(entry);
      }
    }

    if (entries.size === 0) {
      this.handlers.delete(eventName);
    }
  }

  public emit<K extends keyof TEventMap>(eventName: K, payload: TEventMap[K]): void {
    this.assertEventAllowed(eventName);

    const entries = this.handlers.get(eventName);
    if (!entries || entries.size === 0) {
      return;
    }

    const snapshot = [...entries] as HandlerEntry<TEventMap[K]>[];
    for (const entry of snapshot) {
      try {
        entry.handler(payload);
      } catch (error) {
        throw FrameworkError.fromUnknown(
          'EventBus',
          'HANDLER_FAILED',
          `Event handler threw for '${String(eventName)}'.`,
          error,
          { eventName: String(eventName) },
        );
      }

      if (entry.once) {
        entries.delete(entry as unknown as HandlerEntry<unknown>);
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
  }

  private subscribe<K extends keyof TEventMap>(
    eventName: K,
    handler: EventHandler<TEventMap[K]>,
    once: boolean,
  ): EventSubscription {
    this.assertEventAllowed(eventName);

    let disposed = false;
    const entry: HandlerEntry<TEventMap[K]> = { handler, once };

    let entries = this.handlers.get(eventName);
    if (!entries) {
      entries = new Set<HandlerEntry<unknown>>();
      this.handlers.set(eventName, entries);
    }
    entries.add(entry as unknown as HandlerEntry<unknown>);

    return {
      eventName: String(eventName),
      get disposed(): boolean {
        return disposed;
      },
      dispose: () => {
        if (disposed) {
          return;
        }
        disposed = true;

        const bucket = this.handlers.get(eventName);
        if (!bucket) {
          return;
        }

        bucket.delete(entry as unknown as HandlerEntry<unknown>);
        if (bucket.size === 0) {
          this.handlers.delete(eventName);
        }
      },
    };
  }

  private assertEventAllowed(eventName: keyof TEventMap): void {
    if (!this.allowedEventSet) {
      return;
    }

    if (!this.allowedEventSet.has(eventName)) {
      throw new FrameworkError({
        module: 'EventBus',
        code: 'EVENT_NOT_ALLOWED',
        message: `Event '${String(eventName)}' is not declared in allowed events.`,
      });
    }
  }
}