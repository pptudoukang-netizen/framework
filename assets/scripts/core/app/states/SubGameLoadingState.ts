import { CoreTokens } from '../CoreTokens';
import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import { FrameworkError } from '../../error/FrameworkError';
import type { SubGameLifecycleService } from '../../gameplay/SubGameLifecycleService';
import type { SubGameEnterParams } from '../../gameplay/SubGameTypes';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class SubGameLoadingState extends GameFlowStateBase {
  public readonly id = GameState.SubGameLoading;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(params?: unknown): Promise<void> {
    const lifecycle = this.context.get(CoreTokens.SubGameLifecycleService) as SubGameLifecycleService;
    const enterParams = this.parseEnterParams(params);
    const runtimeContext = await lifecycle.preload(enterParams);
    await this.transition(GameState.SubGameRunning, runtimeContext);
  }

  private parseEnterParams(params: unknown): SubGameEnterParams {
    if (!params || typeof params !== 'object') {
      throw new FrameworkError({
        module: 'SubGameLoadingState',
        code: 'PARAMS_MISSING',
        message: 'SubGameLoadingState requires SubGameEnterParams.',
      });
    }

    const record = params as Record<string, unknown>;
    if (typeof record.gameId !== 'string' || record.gameId.length === 0) {
      throw new FrameworkError({
        module: 'SubGameLoadingState',
        code: 'GAME_ID_MISSING',
        message: 'SubGameEnterParams.gameId is required.',
      });
    }

    if (typeof record.playerId !== 'string' || record.playerId.length === 0) {
      throw new FrameworkError({
        module: 'SubGameLoadingState',
        code: 'PLAYER_ID_MISSING',
        message: 'SubGameEnterParams.playerId is required.',
      });
    }

    return params as SubGameEnterParams;
  }
}
