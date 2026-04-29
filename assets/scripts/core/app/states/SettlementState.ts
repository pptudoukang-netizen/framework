import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class SettlementState extends GameFlowStateBase {
  public readonly id = GameState.Settlement;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(): Promise<void> {
    this.logger.info('SettlementState', 'Settlement state entered.');
    await this.transition(GameState.Home);
  }
}