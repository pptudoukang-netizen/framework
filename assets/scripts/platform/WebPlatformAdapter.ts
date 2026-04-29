import { FrameworkError } from '../core/error/FrameworkError';
import type { PlatformAdapter } from './PlatformAdapter';
import type {
  PlatformLoginResult,
  PlatformPayParams,
  PlatformShareParams,
  RewardAdResult,
} from './PlatformTypes';

export class WebPlatformAdapter implements PlatformAdapter {
  private readonly loginProvider?: () => Promise<PlatformLoginResult>;

  public constructor(loginProvider?: () => Promise<PlatformLoginResult>) {
    this.loginProvider = loginProvider;
  }

  public getPlatformName(): 'web' {
    return 'web';
  }

  public async login(): Promise<PlatformLoginResult> {
    if (!this.loginProvider) {
      throw new FrameworkError({
        module: 'WebPlatformAdapter',
        code: 'LOGIN_PROVIDER_MISSING',
        message: 'Web login provider is not configured.',
      });
    }

    return this.loginProvider();
  }

  public async showRewardAd(placementId: string): Promise<RewardAdResult> {
    if (!placementId || placementId.trim().length === 0) {
      throw new FrameworkError({
        module: 'WebPlatformAdapter',
        code: 'AD_PLACEMENT_EMPTY',
        message: 'Reward ad placement id cannot be empty.',
      });
    }
    throw new FrameworkError({
      module: 'WebPlatformAdapter',
      code: 'AD_NOT_IMPLEMENTED',
      message: `Reward ad not implemented for web platform. placementId=${placementId}`,
    });
  }

  public async pay(params: PlatformPayParams): Promise<void> {
    void params;
    throw new FrameworkError({
      module: 'WebPlatformAdapter',
      code: 'PAY_NOT_IMPLEMENTED',
      message: 'Web pay is not implemented.',
    });
  }

  public async share(params: PlatformShareParams): Promise<void> {
    void params;
    throw new FrameworkError({
      module: 'WebPlatformAdapter',
      code: 'SHARE_NOT_IMPLEMENTED',
      message: 'Web share is not implemented.',
    });
  }

  public vibrateShort(): void {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(50);
      return;
    }

    throw new FrameworkError({
      module: 'WebPlatformAdapter',
      code: 'VIBRATE_UNSUPPORTED',
      message: 'navigator.vibrate is unavailable on this platform.',
    });
  }
}
