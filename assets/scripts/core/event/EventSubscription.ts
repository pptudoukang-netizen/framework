import type { Disposable } from '../app/Disposable';

export interface EventSubscription extends Disposable {
  readonly eventName: string;
  readonly disposed: boolean;
}