import { FrameworkError } from '../../core/error/FrameworkError';
import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';

export class BagService extends BaseService {
  private readonly itemCount = new Map<number, number>();

  public constructor(context: AppContext) {
    super(context);
  }

  public getItemCount(itemId: number): number {
    return this.itemCount.get(itemId) ?? 0;
  }

  public addItem(itemId: number, count: number): void {
    if (count <= 0) {
      throw new FrameworkError({
        module: 'BagService',
        code: 'INVALID_COUNT',
        message: `addItem count must be > 0. got ${count}`,
      });
    }

    this.itemCount.set(itemId, this.getItemCount(itemId) + count);
  }

  public consumeItem(itemId: number, count: number): void {
    if (count <= 0) {
      throw new FrameworkError({
        module: 'BagService',
        code: 'INVALID_COUNT',
        message: `consumeItem count must be > 0. got ${count}`,
      });
    }

    const current = this.getItemCount(itemId);
    if (current < count) {
      throw new FrameworkError({
        module: 'BagService',
        code: 'ITEM_NOT_ENOUGH',
        message: `Item ${itemId} not enough. need=${count} have=${current}`,
      });
    }

    this.itemCount.set(itemId, current - count);
  }
}