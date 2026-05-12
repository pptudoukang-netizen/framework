import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { ServiceToken } from './ServiceToken';
import { isDisposable } from './Disposable';

export class AppContext {
  private readonly registry = new Map<symbol, unknown>();
  private disposed = false;

  public register<T>(token: ServiceToken<T>, instance: T): void {
    this.ensureAlive();
    Assert.notNull(instance, `Service '${token.name}' cannot be null or undefined.`);

    if (this.registry.has(token.key)) {
      throw new FrameworkError({
        module: 'AppContext',
        code: 'DUPLICATE_SERVICE_TOKEN',
        message: `Service token '${token.name}' already registered.`,
      });
    }

    this.registry.set(token.key, instance);
  }

  public has<T>(token: ServiceToken<T>): boolean {
    this.ensureAlive();
    return this.registry.has(token.key);
  }

  public get<T>(token: ServiceToken<T>): T {
    this.ensureAlive();

    const instance = this.registry.get(token.key);
    if (instance === undefined) {
      throw new FrameworkError({
        module: 'AppContext',
        code: 'SERVICE_NOT_FOUND',
        message: `Service token '${token.name}' is not registered.`,
      });
    }

    return instance as T;
  }

  public dispose(): void {
    this.ensureAlive();
    this.disposed = true;

    const errors: FrameworkError[] = [];

    const entries = [...this.registry.entries()].reverse();
    for (const [key, instance] of entries) {
      if (!isDisposable(instance)) {
        continue;
      }

      try {
        instance.dispose();
      } catch (error) {
        errors.push(
          FrameworkError.fromUnknown(
            'AppContext',
            'SERVICE_DISPOSE_FAILED',
            'Failed to dispose service.',
            error,
            { key: String(key) },
          ),
        );
      }
    }

    this.registry.clear();

    if (errors.length > 0) {
      throw new FrameworkError({
        module: 'AppContext',
        code: 'DISPOSE_FAILED',
        message: 'One or more services failed to dispose.',
        details: {
          errors: errors.map((item) => item.message),
        },
      });
    }
  }

  private ensureAlive(): void {
    if (this.disposed) {
      throw new FrameworkError({
        module: 'AppContext',
        code: 'CONTEXT_DISPOSED',
        message: 'AppContext is already disposed.',
      });
    }
  }
}
