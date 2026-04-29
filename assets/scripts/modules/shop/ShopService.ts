import { FrameworkError } from '../../core/error/FrameworkError';
import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';

export class ShopService extends BaseService {
  private readonly boughtCount = new Map<number, number>();

  public constructor(context: AppContext) {
    super(context);
  }

  public canBuy(productId: number, limit: number): boolean {
    return (this.boughtCount.get(productId) ?? 0) < limit;
  }

  public buy(productId: number, limit: number): void {
    if (!this.canBuy(productId, limit)) {
      throw new FrameworkError({
        module: 'ShopService',
        code: 'BUY_LIMIT_REACHED',
        message: `Product ${productId} buy limit reached. limit=${limit}`,
      });
    }

    this.boughtCount.set(productId, (this.boughtCount.get(productId) ?? 0) + 1);
  }
}