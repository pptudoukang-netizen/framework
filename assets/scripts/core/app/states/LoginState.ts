import { CoreTokens } from '../CoreTokens';
import { GameState } from '../GameState';
import type { AppContext } from '../AppContext';
import type { Logger } from '../../logger/Logger';
import type { NetworkService } from '../../network/NetworkService';
import type { StorageService } from '../../storage/StorageService';
import type { PlatformService } from '../../../platform/PlatformService';
import { GameFlowStateBase, type GameStateTransition } from './GameFlowStateBase';

export class LoginState extends GameFlowStateBase {
  public readonly id = GameState.Login;

  public constructor(context: AppContext, logger: Logger, transition: GameStateTransition) {
    super(context, logger, transition);
  }

  public override async enter(): Promise<void> {
    const platform = this.context.get(CoreTokens.PlatformService) as PlatformService;
    const network = this.context.get(CoreTokens.NetworkService) as NetworkService;
    const storage = this.context.get(CoreTokens.StorageService) as StorageService;

    const loginResult = await platform.login();
    await network.loginWithPlatform(loginResult);
    await network.connectIfNeeded();
    await storage.loadOrCreate();

    await this.transition(GameState.Hall);
  }
}
