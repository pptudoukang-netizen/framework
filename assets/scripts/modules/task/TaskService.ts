import { FrameworkError } from '../../core/error/FrameworkError';
import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';

export class TaskService extends BaseService {
  private readonly progress = new Map<number, number>();
  private readonly claimed = new Set<number>();

  public constructor(context: AppContext) {
    super(context);
  }

  public updateProgress(taskId: number, value: number): void {
    if (value < 0) {
      throw new FrameworkError({
        module: 'TaskService',
        code: 'INVALID_PROGRESS',
        message: `Task progress cannot be negative. got ${value}`,
      });
    }

    this.progress.set(taskId, value);
  }

  public claim(taskId: number, required: number): void {
    const value = this.progress.get(taskId) ?? 0;
    if (value < required) {
      throw new FrameworkError({
        module: 'TaskService',
        code: 'TASK_NOT_FINISHED',
        message: `Task ${taskId} not finished. required=${required} current=${value}`,
      });
    }

    if (this.claimed.has(taskId)) {
      throw new FrameworkError({
        module: 'TaskService',
        code: 'TASK_ALREADY_CLAIMED',
        message: `Task ${taskId} already claimed.`,
      });
    }

    this.claimed.add(taskId);
  }
}