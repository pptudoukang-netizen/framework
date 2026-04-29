import type { AppContext } from '../app/AppContext';

export interface IModule {
  readonly name: string;
  init(context: AppContext): Promise<void> | void;
  start?(): Promise<void> | void;
  dispose(): void;
}