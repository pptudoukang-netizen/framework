import { BaseModel } from '../../core/module/BaseModel';
import type { HallSubGameEntry } from './HallTypes';

export class HallModel extends BaseModel {
  private entries: HallSubGameEntry[] = [];

  public setEntries(entries: readonly HallSubGameEntry[]): void {
    this.entries = [...entries];
    this.markChanged();
  }

  public getEntries(): readonly HallSubGameEntry[] {
    return this.entries;
  }
}
