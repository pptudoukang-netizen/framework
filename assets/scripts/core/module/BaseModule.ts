import type { Disposable } from '../app/Disposable';
import type { AppContext } from '../app/AppContext';
import { Assert } from '../error/Assert';
import type { IModule } from './IModule';

export abstract class BaseModule implements IModule {
  public abstract readonly name: string;

  protected context!: AppContext;
  protected readonly disposables: Disposable[] = [];

  public init(context: AppContext): Promise<void> | void {
    this.context = Assert.notNull(context, `${this.name} init context is required.`);
  }

  public start?(): Promise<void> | void {
    return;
  }

  public dispose(): void {
    for (const disposable of this.disposables.splice(0)) {
      disposable.dispose();
    }
  }

  protected track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }
}