import { FrameworkError } from '../core/error/FrameworkError';
import type { PlatformAdapter } from './PlatformAdapter';
import type {
  PlatformLoginResult,
  PlatformPayParams,
  PlatformShareParams,
  RewardAdResult,
} from './PlatformTypes';

interface WechatLike {
  login: (options: {
    success: (result: { code?: string }) => void;
    fail: (error: unknown) => void;
  }) => void;
}

declare const wx: WechatLike | undefined;

export class WechatPlatformAdapter implements PlatformAdapter {
  public getPlatformName(): 'wechat' {
    return 'wechat';
  }

  public async login(): Promise<PlatformLoginResult> {
    if (typeof wx === 'undefined') {
      throw new FrameworkError({
        module: 'WechatPlatformAdapter',
        code: 'WX_UNAVAILABLE',
        message: 'WeChat runtime is unavailable.',
      });
    }

    const code = await new Promise<string>((resolve, reject) => {
      wx.login({
        success: (result) => {
          if (!result.code) {
            reject(
              new FrameworkError({
                module: 'WechatPlatformAdapter',
                code: 'WX_LOGIN_CODE_MISSING',
                message: 'wx.login succeeded but no code returned.',
              }),
            );
            return;
          }

          resolve(result.code);
        },
        fail: (error) => reject(error),
      });
    });

    return {
      platformUserId: code,
      displayName: 'WechatUser',
      accessToken: code,
    };
  }

  public async showRewardAd(_placementId: string): Promise<RewardAdResult> {
    throw new FrameworkError({
      module: 'WechatPlatformAdapter',
      code: 'NOT_IMPLEMENTED',
      message: 'Wechat reward ad adapter is not implemented yet.',
    });
  }

  public async pay(_params: PlatformPayParams): Promise<void> {
    throw new FrameworkError({
      module: 'WechatPlatformAdapter',
      code: 'NOT_IMPLEMENTED',
      message: 'Wechat pay adapter is not implemented yet.',
    });
  }

  public async share(_params: PlatformShareParams): Promise<void> {
    throw new FrameworkError({
      module: 'WechatPlatformAdapter',
      code: 'NOT_IMPLEMENTED',
      message: 'Wechat share adapter is not implemented yet.',
    });
  }

  public vibrateShort(): void {
    throw new FrameworkError({
      module: 'WechatPlatformAdapter',
      code: 'NOT_IMPLEMENTED',
      message: 'Wechat vibrate adapter is not implemented yet.',
    });
  }
}