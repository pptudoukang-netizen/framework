import { CoreTokens } from '../CoreTokens';
import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { ConfigService } from '../../config/ConfigService';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class LoadConfigState extends GameFlowStateBase {
  public readonly id = GameState.LoadConfig;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(): Promise<void> {
    const configService = this.context.get(CoreTokens.ConfigService) as ConfigService;
    await configService.loadAll();
    await this.transition(GameState.Login);
  }
}