export interface RewardItem {
  itemId: number;
  count: number;
}

export interface RewardConfig {
  id: number;
  items: RewardItem[];
}