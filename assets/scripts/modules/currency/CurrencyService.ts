import { FrameworkError } from '../../core/error/FrameworkError';
import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';

export type CurrencyType = 'coin' | 'diamond';

export class CurrencyService extends BaseService {
  private readonly balances = new Map<CurrencyType, number>([
    ['coin', 0],
    ['diamond', 0],
  ]);

  public constructor(context: AppContext) {
    super(context);
  }

  public getBalance(type: CurrencyType): number {
    return this.balances.get(type) ?? 0;
  }

  public add(type: CurrencyType, amount: number): void {
    if (amount <= 0) {
      throw new FrameworkError({
        module: 'CurrencyService',
        code: 'INVALID_AMOUNT',
        message: `Currency add amount must be > 0. got ${amount}`,
      });
    }

    this.balances.set(type, this.getBalance(type) + amount);
  }

  public consume(type: CurrencyType, amount: number): void {
    if (amount <= 0) {
      throw new FrameworkError({
        module: 'CurrencyService',
        code: 'INVALID_AMOUNT',
        message: `Currency consume amount must be > 0. got ${amount}`,
      });
    }

    const current = this.getBalance(type);
    if (current < amount) {
      throw new FrameworkError({
        module: 'CurrencyService',
        code: 'BALANCE_NOT_ENOUGH',
        message: `Currency ${type} not enough. need=${amount} have=${current}`,
      });
    }

    this.balances.set(type, current - amount);
  }
}