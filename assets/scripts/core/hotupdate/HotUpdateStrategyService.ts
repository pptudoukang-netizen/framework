import { Assert } from '../error/Assert';
import type { HotUpdateConfig, HotUpdateStrategyConfig } from './HotUpdateTypes';

export class HotUpdateStrategyService {
  private readonly config: HotUpdateStrategyConfig;

  public constructor(config: HotUpdateStrategyConfig) {
    this.validateHotUpdateConfig(config.shellUpdateConfig, 'shellUpdateConfig');
    this.validateHotUpdateConfig(config.fullUpdateConfig, 'fullUpdateConfig');
    this.config = config;
  }

  public isSubGameIndependentUpdateEnabled(): boolean {
    return this.config.subGameIndependentUpdateEnabled;
  }

  public getStartupUpdateConfig(): HotUpdateConfig {
    if (this.config.subGameIndependentUpdateEnabled) {
      return this.config.shellUpdateConfig;
    }

    return this.config.fullUpdateConfig;
  }

  private validateHotUpdateConfig(config: HotUpdateConfig, name: string): void {
    Assert.nonEmptyString(config.localManifestPath, `${name}.localManifestPath is required.`);
    Assert.nonEmptyString(config.remoteVersionUrl, `${name}.remoteVersionUrl is required.`);
    Assert.nonEmptyString(config.remoteManifestUrl, `${name}.remoteManifestUrl is required.`);
  }
}
