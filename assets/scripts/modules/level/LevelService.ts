import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';

export class LevelService extends BaseService {
  private currentLevelId = 1;
  private readonly completed = new Set<number>();

  public constructor(context: AppContext) {
    super(context);
  }

  public getCurrentLevelId(): number {
    return this.currentLevelId;
  }

  public unlockLevel(levelId: number): void {
    if (levelId > this.currentLevelId) {
      this.currentLevelId = levelId;
    }
  }

  public markCompleted(levelId: number): void {
    this.completed.add(levelId);
  }

  public isCompleted(levelId: number): boolean {
    return this.completed.has(levelId);
  }
}