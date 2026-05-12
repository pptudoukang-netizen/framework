import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class HallState extends GameFlowStateBase {
  public readonly id = GameState.Hall;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override enter(): void {
    this.logger.info('HallState', 'Hall state entered. Waiting for subgame selection.');
  }
}
