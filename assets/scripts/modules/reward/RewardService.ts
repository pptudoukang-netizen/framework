import type { AppContext } from '../../core/app/AppContext';
import { FrameworkError } from '../../core/error/FrameworkError';
import { BaseService } from '../../core/module/BaseService';

export interface RewardGrant {
  itemId: number;
  count: number;
}

export class RewardService extends BaseService {
  public constructor(context: AppContext) {
    super(context);
  }

  public resolveReward(rewardId: number): RewardGrant[] {
    throw new FrameworkError({
      module: 'RewardService',
      code: 'REWARD_CONFIG_NOT_BOUND',
      message: `Reward config repository is not bound. Cannot resolve reward '${rewardId}'.`,
    });
  }
}
