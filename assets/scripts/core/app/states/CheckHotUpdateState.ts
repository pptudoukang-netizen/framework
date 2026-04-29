import { CoreTokens } from '../CoreTokens';
import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { HotUpdateService } from '../../hotupdate/HotUpdateService';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class CheckHotUpdateState extends GameFlowStateBase {
  public readonly id = GameState.CheckHotUpdate;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(): Promise<void> {
    const hotUpdate = this.context.get(CoreTokens.HotUpdateService) as HotUpdateService;
    const result = await hotUpdate.checkForUpdate();

    if (result.status === 'update-required') {
      await this.transition(GameState.DownloadHotUpdate);
      return;
    }

    await this.transition(GameState.LoadConfig);
  }
}