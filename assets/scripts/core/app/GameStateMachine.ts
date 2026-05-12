import type { AppContext } from './AppContext';
import { CoreTokens } from './CoreTokens';
import { GameState } from './GameState';
import { BootState } from './states/BootState';
import { CheckHotUpdateState } from './states/CheckHotUpdateState';
import { DownloadHotUpdateState } from './states/DownloadHotUpdateState';
import { HallState } from './states/HallState';
import { LoadConfigState } from './states/LoadConfigState';
import { LoginState } from './states/LoginState';
import { RestartRequiredState } from './states/RestartRequiredState';
import { SubGameLoadingState } from './states/SubGameLoadingState';
import { SubGameRunningState } from './states/SubGameRunningState';
import { SubGameSettlementState } from './states/SubGameSettlementState';
import type { EventBus } from '../event/EventBus';
import type { AppEventMap } from '../event/AppEventMap';
import type { Logger } from '../logger/Logger';
import { StateMachine } from '../fsm/StateMachine';
import { StateTransitionTable } from '../fsm/StateTransitionTable';
import type { SubGameEnterParams, SubGameExitReason, SubGameExitResult } from '../gameplay/SubGameTypes';
import type { SubGameLifecycleService } from '../gameplay/SubGameLifecycleService';

export class GameStateMachine {
  private readonly machine: StateMachine<GameState>;

  public constructor(private readonly context: AppContext) {
    const logger = this.context.get(CoreTokens.Logger) as Logger;
    const eventBus = this.context.get(CoreTokens.EventBus) as EventBus<AppEventMap>;
    const transitionTable = new StateTransitionTable<GameState>();

    this.configureTransitionTable(transitionTable);

    this.machine = new StateMachine<GameState>({
      module: 'GameStateMachine',
      logger,
      eventBus,
      transitionTable,
    });

    const transition = async (nextState: GameState, params?: unknown): Promise<void> => {
      await this.machine.changeTo(nextState, params);
    };

    this.machine.register(new BootState(this.context, logger, transition));
    this.machine.register(new CheckHotUpdateState(this.context, logger, transition));
    this.machine.register(new DownloadHotUpdateState(this.context, logger, transition));
    this.machine.register(new RestartRequiredState(this.context, logger, transition));
    this.machine.register(new LoadConfigState(this.context, logger, transition));
    this.machine.register(new LoginState(this.context, logger, transition));
    this.machine.register(new HallState(this.context, logger, transition));
    this.machine.register(new SubGameLoadingState(this.context, logger, transition));
    this.machine.register(new SubGameRunningState(this.context, logger, transition));
    this.machine.register(new SubGameSettlementState(this.context, logger, transition));
  }

  public async start(): Promise<void> {
    await this.machine.start(GameState.Boot);
  }

  public async changeTo(nextState: GameState, params?: unknown): Promise<void> {
    await this.machine.changeTo(nextState, params);
  }

  public async enterSubGame(params: SubGameEnterParams): Promise<void> {
    await this.changeTo(GameState.SubGameLoading, params);
  }

  public async exitSubGame(reason: SubGameExitReason): Promise<SubGameExitResult> {
    const lifecycle = this.context.get(CoreTokens.SubGameLifecycleService) as SubGameLifecycleService;
    const result = await lifecycle.exit(reason);

    if (result.settlementRequired) {
      await this.changeTo(GameState.SubGameSettlement, result);
      return result;
    }

    await this.changeTo(GameState.Hall, result);
    return result;
  }

  public update(deltaTime: number): void {
    this.machine.update(deltaTime);
  }

  public getCurrentStateId(): GameState | null {
    return this.machine.getCurrentStateId();
  }

  private configureTransitionTable(table: StateTransitionTable<GameState>): void {
    table.allow(GameState.Boot, GameState.CheckHotUpdate);
    table.allow(GameState.CheckHotUpdate, GameState.DownloadHotUpdate);
    table.allow(GameState.CheckHotUpdate, GameState.LoadConfig);
    table.allow(GameState.DownloadHotUpdate, GameState.RestartRequired);
    table.allow(GameState.DownloadHotUpdate, GameState.LoadConfig);
    table.allow(GameState.LoadConfig, GameState.Login);
    table.allow(GameState.Login, GameState.Hall);
    table.allow(GameState.Hall, GameState.SubGameLoading);
    table.allow(GameState.SubGameLoading, GameState.SubGameRunning);
    table.allow(GameState.SubGameRunning, GameState.SubGameSettlement);
    table.allow(GameState.SubGameRunning, GameState.Hall);
    table.allow(GameState.SubGameSettlement, GameState.Hall);
  }
}
