export type PlatformName = 'web' | 'wechat' | 'android' | 'ios' | 'unknown';

export interface PlatformLoginResult {
  readonly platformUserId: string;
  readonly displayName: string;
  readonly accessToken: string;
}

export interface PlatformShareParams {
  readonly title: string;
  readonly imageUrl?: string;
  readonly query?: string;
}

export interface PlatformPayParams {
  readonly productId: string;
  readonly orderId: string;
  readonly amount: number;
  readonly currency: string;
}

export interface RewardAdResult {
  readonly watched: boolean;
  readonly placementId: string;
}