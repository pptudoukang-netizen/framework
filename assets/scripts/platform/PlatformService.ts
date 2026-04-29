import { FrameworkError } from '../core/error/FrameworkError';
import type { Logger } from '../core/logger/Logger';
import type { PlatformAdapter } from './PlatformAdapter';
import type {
  PlatformLoginResult,
  PlatformPayParams,
  PlatformShareParams,
  RewardAdResult,
} from './PlatformTypes';

export class PlatformService {
  private readonly logger: Logger;
  private adapter: PlatformAdapter | null;

  public constructor(logger: Logger, adapter: PlatformAdapter | null) {
    this.logger = logger;
    this.adapter = adapter;
  }

  public setAdapter(adapter: PlatformAdapter): void {
    this.adapter = adapter;
  }

  public async login(): Promise<PlatformLoginResult> {
    const adapter = this.requireAdapter();
    try {
      return await adapter.login();
    } catch (error) {
      throw FrameworkError.fromUnknown('PlatformService', 'LOGIN_FAILED', 'Platform login failed.', error);
    }
  }

  public async showRewardAd(placementId: string): Promise<RewardAdResult> {
    const adapter = this.requireAdapter();
    try {
      return await adapter.showRewardAd(placementId);
    } catch (error) {
      throw FrameworkError.fromUnknown('PlatformService', 'SHOW_REWARD_AD_FAILED', 'Show reward ad failed.', error);
    }
  }

  public async pay(params: PlatformPayParams): Promise<void> {
    const adapter = this.requireAdapter();
    try {
      await adapter.pay(params);
    } catch (error) {
      throw FrameworkError.fromUnknown('PlatformService', 'PAY_FAILED', 'Platform pay failed.', error);
    }
  }

  public async share(params: PlatformShareParams): Promise<void> {
    const adapter = this.requireAdapter();
    try {
      await adapter.share(params);
    } catch (error) {
      throw FrameworkError.fromUnknown('PlatformService', 'SHARE_FAILED', 'Platform share failed.', error);
    }
  }

  public vibrateShort(): void {
    const adapter = this.requireAdapter();
    try {
      adapter.vibrateShort();
    } catch (error) {
      throw FrameworkError.fromUnknown('PlatformService', 'VIBRATE_FAILED', 'Platform vibrate failed.', error);
    }
  }

  public dispose(): void {
    this.logger.info('PlatformService', 'Platform service disposed.');
  }

  private requireAdapter(): PlatformAdapter {
    if (!this.adapter) {
      throw new FrameworkError({
        module: 'PlatformService',
        code: 'ADAPTER_MISSING',
        message: 'Platform adapter is not configured.',
      });
    }

    return this.adapter;
  }
}