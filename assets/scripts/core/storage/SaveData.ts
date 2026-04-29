export interface PlayerSaveData {
  playerId: string;
  nickname: string;
}

export interface BagSaveData {
  items: Record<string, number>;
}

export interface LevelSaveData {
  currentLevelId: number;
  completedLevelIds: number[];
}

export interface ShopSaveData {
  purchasedIds: Record<string, number>;
}

export interface TaskSaveData {
  progress: Record<string, number>;
  claimed: string[];
}

export interface GuideSaveData {
  currentStep: number;
  completedSteps: number[];
}

export interface SaveData {
  version: number;
  player: PlayerSaveData;
  bag: BagSaveData;
  level: LevelSaveData;
  shop: ShopSaveData;
  task: TaskSaveData;
  guide: GuideSaveData;
}

export function createNewSaveData(version: number): SaveData {
  return {
    version,
    player: {
      playerId: '',
      nickname: '',
    },
    bag: {
      items: {},
    },
    level: {
      currentLevelId: 1,
      completedLevelIds: [],
    },
    shop: {
      purchasedIds: {},
    },
    task: {
      progress: {},
      claimed: [],
    },
    guide: {
      currentStep: 0,
      completedSteps: [],
    },
  };
}