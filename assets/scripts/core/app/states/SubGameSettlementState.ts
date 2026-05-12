import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import { FrameworkError } from '../../error/FrameworkError';
import type { SubGameExitResult } from '../../gameplay/SubGameTypes';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class SubGameSettlementState extends GameFlowStateBase {
  public readonly id = GameState.SubGameSettlement;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(params?: unknown): Promise<void> {
    const result = this.parseExitResult(params);
    this.logger.info('SubGameSettlementState', `Subgame settlement: ${result.gameId}`, {
      resultId: result.resultId,
      score: result.score,
      rewardId: result.rewardId,
    });

    await this.transition(GameState.Hall);
  }

  private parseExitResult(params: unknown): SubGameExitResult {
    if (!params || typeof params !== 'object') {
      throw new FrameworkError({
        module: 'SubGameSettlementState',
        code: 'RESULT_MISSING',
        message: 'SubGameSettlementState requires SubGameExitResult.',
      });
    }

    const record = params as Record<string, unknown>;
    if (typeof record.gameId !== 'string' || record.gameId.length === 0) {
      throw new FrameworkError({
        module: 'SubGameSettlementState',
        code: 'GAME_ID_MISSING',
        message: 'SubGameExitResult.gameId is required.',
      });
    }

    if (typeof record.settlementRequired !== 'boolean') {
      throw new FrameworkError({
        module: 'SubGameSettlementState',
        code: 'SETTLEMENT_FLAG_MISSING',
        message: 'SubGameExitResult.settlementRequired is required.',
      });
    }

    return params as SubGameExitResult;
  }
}
