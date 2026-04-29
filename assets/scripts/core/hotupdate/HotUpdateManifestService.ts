import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { HotUpdateConfig } from './HotUpdateTypes';

export class HotUpdateManifestService {
  private config: HotUpdateConfig | null = null;

  public setConfig(config: HotUpdateConfig): void {
    Assert.nonEmptyString(config.localManifestPath, 'Hot update localManifestPath is required.');
    Assert.nonEmptyString(config.remoteVersionUrl, 'Hot update remoteVersionUrl is required.');
    Assert.nonEmptyString(config.remoteManifestUrl, 'Hot update remoteManifestUrl is required.');

    this.config = config;
  }

  public getConfig(): HotUpdateConfig {
    if (!this.config) {
      throw new FrameworkError({
        module: 'HotUpdateManifestService',
        code: 'CONFIG_MISSING',
        message: 'Hot update config is not set.',
      });
    }

    return this.config;
  }
}