import type { AppContext } from '../../../core/app/AppContext';
import type {
  SubGameExitReason,
  SubGameExitResult,
  SubGameRuntimeContext,
} from '../../../core/gameplay/SubGameTypes';
import { FrameworkError } from '../../../core/error/FrameworkError';
import { BaseService } from '../../../core/module/BaseService';
import { ExampleGameModel } from './ExampleGameModel';

export class ExampleGameService extends BaseService {
  private readonly model: ExampleGameModel;
  private gameId = 'exampleGame';

  public constructor(context: AppContext, model: ExampleGameModel) {
    super(context);
    this.model = model;
  }

  public preload(_params: SubGameRuntimeContext): void {
    return;
  }

  public enter(params: SubGameRuntimeContext): void {
    this.gameId = params.gameId;
    this.model.start(params.runId);
  }

  public exit(_reason: SubGameExitReason): SubGameExitResult {
    if (!this.model.isRunning()) {
      throw new FrameworkError({
        module: 'ExampleGameService',
        code: 'GAME_NOT_RUNNING',
        message: 'Cannot exit exampleGame because it is not running.',
      });
    }

    this.model.stop();
    return {
      gameId: this.gameId,
      settlementRequired: false,
      resultId: 'example-no-settlement',
    };
  }

  public getRunId(): string | null {
    return this.model.getRunId();
  }
}
