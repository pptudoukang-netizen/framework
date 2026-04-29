import { BaseModel } from '../../core/module/BaseModel';

export class ExampleModel extends BaseModel {
  private count = 0;

  public getCount(): number {
    return this.count;
  }

  public setCount(next: number): void {
    this.count = next;
    this.markChanged();
  }
}