export interface IState<TStateId extends string> {
  readonly id: TStateId;
  enter(params?: unknown): Promise<void> | void;
  exit(): Promise<void> | void;
  update?(deltaTime: number): void;
}