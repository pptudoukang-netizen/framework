import { BaseConfigRepository } from '../core/config/BaseConfigRepository';
import type { ConfigService } from '../core/config/ConfigService';
import type { SubGameConfigProvider } from '../core/gameplay/SubGameConfigTypes';
import type { SubGameConfig } from './SubGameConfig';

export class SubGameConfigRepository
  extends BaseConfigRepository<SubGameConfig>
  implements SubGameConfigProvider
{
  public constructor(configService: ConfigService) {
    super(configService, 'subgame_config');
  }

  public get(gameId: string): SubGameConfig {
    return this.getTable<string>().get(gameId);
  }

  public getAll(): readonly SubGameConfig[] {
    return this.getTable<string>().getAll();
  }
}
