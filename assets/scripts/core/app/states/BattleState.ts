import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { Logger } from '../../logger/Logger';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class BattleState extends GameFlowStateBase {
  public readonly id = GameState.Battle;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override enter(): void {
    this.logger.info('BattleState', 'Battle state entered.');
  }
}