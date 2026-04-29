export interface ShopConfig {
  id: number;
  priceType: 'coin' | 'diamond' | 'rmb';
  priceValue: number;
  rewardId: number;
  limit: number;
}