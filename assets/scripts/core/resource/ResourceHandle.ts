import type { Disposable } from '../app/Disposable';
import { FrameworkError } from '../error/FrameworkError';

export class ResourceHandle<TAsset> implements Disposable {
  public readonly key: string;
  public readonly asset: TAsset;
  private released = false;
  private readonly releaseFn: () => void;

  public constructor(key: string, asset: TAsset, releaseFn: () => void) {
    this.key = key;
    this.asset = asset;
    this.releaseFn = releaseFn;
  }

  public dispose(): void {
    this.release();
  }

  public release(): void {
    if (this.released) {
      throw new FrameworkError({
        module: 'ResourceHandle',
        code: 'DOUBLE_RELEASE',
        message: `Resource handle '${this.key}' was already released.`,
      });
    }

    this.released = true;
    this.releaseFn();
  }

  public isReleased(): boolean {
    return this.released;
  }
}