import type { AppContext } from '../AppContext';
import { BaseState } from '../../fsm/BaseState';
import type { Logger } from '../../logger/Logger';
import type { GameState } from '../GameState';

export type GameStateTransition = (nextState: GameState, params?: unknown) => Promise<void>;

export abstract class GameFlowStateBase extends BaseState<GameState> {
  protected readonly context: AppContext;
  protected readonly transition: GameStateTransition;

  protected constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(logger);
    this.context = context;
    this.transition = transition;
  }
}