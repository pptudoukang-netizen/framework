import { CoreTokens } from '../../core/app/CoreTokens';
import type { AppContext } from '../../core/app/AppContext';
import type { GameStateMachine } from '../../core/app/GameStateMachine';
import { FrameworkError } from '../../core/error/FrameworkError';
import type { SubGameConfigProvider } from '../../core/gameplay/SubGameConfigTypes';
import type { SubGameRegistry } from '../../core/gameplay/SubGameRegistry';
import { BaseService } from '../../core/module/BaseService';
import { HallModel } from './HallModel';
import type { HallEnterSubGameRequest, HallSubGameEntry } from './HallTypes';

export class HallService extends BaseService {
  private readonly model: HallModel;
  private readonly configProvider: SubGameConfigProvider;
  private readonly subGameRegistry: SubGameRegistry;
  private readonly gameStateMachine: GameStateMachine;

  public constructor(context: AppContext, model: HallModel) {
    super(context);
    this.model = model;
    this.configProvider = context.get(CoreTokens.SubGameConfigProvider);
    this.subGameRegistry = context.get(CoreTokens.SubGameRegistry);
    this.gameStateMachine = context.get(CoreTokens.GameStateMachine);
  }

  public refreshEntries(): readonly HallSubGameEntry[] {
    const entries = this.configProvider.getAll().map((config) => {
      if (!this.subGameRegistry.has(config.id)) {
        throw new FrameworkError({
          module: 'HallService',
          code: 'SUB_GAME_NOT_REGISTERED',
          message: `Subgame config '${config.id}' has no registered module.`,
        });
      }

      return {
        gameId: config.id,
        displayName: config.displayName,
      };
    });
    this.model.setEntries(entries);
    return this.model.getEntries();
  }

  public getEntries(): readonly HallSubGameEntry[] {
    return this.model.getEntries();
  }

  public async requestEnterSubGame(request: HallEnterSubGameRequest): Promise<void> {
    if (!this.subGameRegistry.has(request.gameId)) {
      throw new FrameworkError({
        module: 'HallService',
        code: 'SUB_GAME_NOT_REGISTERED',
        message: `Cannot enter unregistered subgame '${request.gameId}'.`,
      });
    }

    await this.gameStateMachine.enterSubGame(request);
  }
}
