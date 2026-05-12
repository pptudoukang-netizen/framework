import type { AppContext } from '../../../core/app/AppContext';
import { CoreTokens } from '../../../core/app/CoreTokens';
import { BaseModule } from '../../../core/module/BaseModule';
import type {
  SubGameExitReason,
  SubGameExitResult,
  SubGameModule,
  SubGameRuntimeContext,
} from '../../../core/gameplay/SubGameTypes';
import { ExampleGameController } from './ExampleGameController';
import { ExampleGameModel } from './ExampleGameModel';
import { ExampleGameService } from './ExampleGameService';

export class ExampleGameModule extends BaseModule implements SubGameModule {
  public readonly name = 'ExampleGameModule';
  public readonly gameId = 'exampleGame';

  private model!: ExampleGameModel;
  private service!: ExampleGameService;
  private controller!: ExampleGameController;

  public override init(context: AppContext): void {
    super.init(context);
    this.model = new ExampleGameModel();
    this.service = new ExampleGameService(context, this.model);
    this.controller = new ExampleGameController(this.service, context.get(CoreTokens.GameStateMachine));
  }

  public async preload(params: SubGameRuntimeContext): Promise<void> {
    this.service.preload(params);
  }

  public async enter(params: SubGameRuntimeContext): Promise<void> {
    this.service.enter(params);
  }

  public pause(): void {
    return;
  }

  public resume(): void {
    return;
  }

  public async exit(reason: SubGameExitReason): Promise<SubGameExitResult> {
    return this.service.exit(reason);
  }

  public getController(): ExampleGameController {
    return this.controller;
  }

  public getService(): ExampleGameService {
    return this.service;
  }
}
