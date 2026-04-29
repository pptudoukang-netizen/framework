import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class HomeState extends GameFlowStateBase {
  public readonly id = GameState.Home;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override enter(): void {
    this.logger.info('HomeState', 'Home state entered. Waiting for user action.');
  }
}