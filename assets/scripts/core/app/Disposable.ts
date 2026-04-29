export interface Disposable {
  dispose(): void;
}

export interface AsyncDisposable {
  dispose(): Promise<void>;
}

export function isDisposable(value: unknown): value is Disposable {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return typeof (value as Disposable).dispose === 'function';
}