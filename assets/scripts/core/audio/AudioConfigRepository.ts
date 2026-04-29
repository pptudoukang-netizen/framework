import type { AudioConfig } from '../../configs/AudioConfig';
import { FrameworkError } from '../error/FrameworkError';
import { BaseConfigRepository } from '../config/BaseConfigRepository';
import type { ConfigService } from '../config/ConfigService';

export class AudioConfigRepository extends BaseConfigRepository<AudioConfig> {
  public constructor(configService: ConfigService) {
    super(configService, 'audio_config');
  }

  public getByKey(key: string): AudioConfig {
    const table = this.getTable<string>();
    const rows = table.getAll();
    const row = rows.find((item) => item.key === key);

    if (!row) {
      throw new FrameworkError({
        module: 'AudioConfigRepository',
        code: 'AUDIO_KEY_NOT_FOUND',
        message: `Audio config key not found: '${key}'.`,
      });
    }

    return row;
  }
}