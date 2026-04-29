import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class BootState extends GameFlowStateBase {
  public readonly id = GameState.Boot;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(): Promise<void> {
    this.logger.info('BootState', 'Framework boot phase started.');
    await this.transition(GameState.CheckHotUpdate);
  }
}