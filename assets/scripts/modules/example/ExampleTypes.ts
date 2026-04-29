export interface ExampleState {
  count: number;
}

export interface ExampleViewContract {
  renderCount(count: number): void;
}