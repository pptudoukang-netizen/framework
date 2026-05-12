import { CoreTokens } from '../CoreTokens';
import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import { FrameworkError } from '../../error/FrameworkError';
import type { SubGameLifecycleService } from '../../gameplay/SubGameLifecycleService';
import type { SubGameRuntimeContext } from '../../gameplay/SubGameTypes';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class SubGameRunningState extends GameFlowStateBase {
  public readonly id = GameState.SubGameRunning;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(params?: unknown): Promise<void> {
    const lifecycle = this.context.get(CoreTokens.SubGameLifecycleService) as SubGameLifecycleService;
    const runtimeContext = this.parseRuntimeContext(params);
    await lifecycle.enter(runtimeContext);
    this.logger.info('SubGameRunningState', `Subgame running: ${runtimeContext.gameId}`, {
      runId: runtimeContext.runId,
    });
  }

  private parseRuntimeContext(params: unknown): SubGameRuntimeContext {
    if (!params || typeof params !== 'object') {
      throw new FrameworkError({
        module: 'SubGameRunningState',
        code: 'PARAMS_MISSING',
        message: 'SubGameRunningState requires SubGameRuntimeContext.',
      });
    }

    const record = params as Record<string, unknown>;
    const requiredFields = ['gameId', 'playerId', 'runId', 'resourceOwnerId'];
    for (const field of requiredFields) {
      if (typeof record[field] !== 'string' || (record[field] as string).length === 0) {
        throw new FrameworkError({
          module: 'SubGameRunningState',
          code: 'RUNTIME_FIELD_MISSING',
          message: `SubGameRuntimeContext.${field} is required.`,
        });
      }
    }

    return params as SubGameRuntimeContext;
  }
}
