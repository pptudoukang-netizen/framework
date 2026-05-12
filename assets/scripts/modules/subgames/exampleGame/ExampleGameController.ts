import type { GameStateMachine } from '../../../core/app/GameStateMachine';
import { BaseController } from '../../../core/module/BaseController';
import { ExampleGameService } from './ExampleGameService';
import type { ExampleGameViewContract } from './ExampleGameTypes';

export class ExampleGameController extends BaseController<ExampleGameViewContract> {
  private readonly service: ExampleGameService;
  private readonly gameStateMachine: GameStateMachine;

  public constructor(service: ExampleGameService, gameStateMachine: GameStateMachine) {
    super();
    this.service = service;
    this.gameStateMachine = gameStateMachine;
  }

  protected override onViewBound(): void {
    this.refresh();
  }

  public refresh(): void {
    const runId = this.service.getRunId();
    if (!runId) {
      return;
    }

    this.getView().renderRunId(runId);
  }

  public async onExitClicked(): Promise<void> {
    await this.gameStateMachine.exitSubGame('quit');
  }
}
