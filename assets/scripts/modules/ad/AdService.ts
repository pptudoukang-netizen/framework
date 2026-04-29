import { CoreTokens } from '../../core/app/CoreTokens';
import { FrameworkError } from '../../core/error/FrameworkError';
import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';
import type { PlatformService } from '../../platform/PlatformService';

export class AdService extends BaseService {
  private readonly platformService: PlatformService;

  public constructor(context: AppContext) {
    super(context);
    this.platformService = context.get(CoreTokens.PlatformService) as PlatformService;
  }

  public async showRewardAd(placementId: string): Promise<void> {
    const result = await this.platformService.showRewardAd(placementId);
    if (!result.watched) {
      throw new FrameworkError({
        module: 'AdService',
        code: 'AD_NOT_WATCHED',
        message: `Reward ad not fully watched for placement '${placementId}'.`,
      });
    }
  }
}