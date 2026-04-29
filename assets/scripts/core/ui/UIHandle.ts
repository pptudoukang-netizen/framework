import type { Disposable } from '../app/Disposable';

export class UIHandle<TResult = void> implements Disposable {
  public readonly uiId: string;
  private readonly closeFn: () => void;
  private readonly resultPromise: Promise<TResult>;

  public constructor(uiId: string, closeFn: () => void, resultPromise: Promise<TResult>) {
    this.uiId = uiId;
    this.closeFn = closeFn;
    this.resultPromise = resultPromise;
  }

  public close(): void {
    this.closeFn();
  }

  public waitResult(): Promise<TResult> {
    return this.resultPromise;
  }

  public dispose(): void {
    this.close();
  }
}