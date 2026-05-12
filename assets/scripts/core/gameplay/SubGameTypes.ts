export type SubGameExitReason = 'completed' | 'quit' | 'interrupted';

export interface SubGameEnterParams {
  readonly gameId: string;
  readonly playerId: string;
  readonly roomId?: string;
  readonly levelId?: string;
  readonly seed?: string;
}

export interface SubGameRuntimeContext extends SubGameEnterParams {
  readonly runId: string;
  readonly resourceOwnerId: string;
}

export interface SubGameExitResult {
  readonly gameId: string;
  readonly settlementRequired: boolean;
  readonly resultId?: string;
  readonly score?: number;
  readonly rewardId?: string;
}

export interface SubGameModule {
  readonly gameId: string;

  preload(params: SubGameRuntimeContext): Promise<void>;
  enter(params: SubGameRuntimeContext): Promise<void>;
  pause(): void;
  resume(): void;
  exit(reason: SubGameExitReason): Promise<SubGameExitResult>;
  dispose(): void;
}
