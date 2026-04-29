import type { Disposable } from '../app/Disposable';

export interface TimerHandle extends Disposable {
  readonly id: number;
  readonly active: boolean;
}