import type {
  PlatformLoginResult,
  PlatformName,
  PlatformPayParams,
  PlatformShareParams,
  RewardAdResult,
} from './PlatformTypes';

export interface PlatformAdapter {
  getPlatformName(): PlatformName;
  login(): Promise<PlatformLoginResult>;
  showRewardAd(placementId: string): Promise<RewardAdResult>;
  pay(params: PlatformPayParams): Promise<void>;
  share(params: PlatformShareParams): Promise<void>;
  vibrateShort(): void;
}