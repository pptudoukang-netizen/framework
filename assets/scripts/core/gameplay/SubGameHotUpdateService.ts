import type { Disposable } from '../app/Disposable';
import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { AppEventMap } from '../event/AppEventMap';
import type { EventBus } from '../event/EventBus';
import type { HotUpdateAdapter } from '../hotupdate/HotUpdateAdapter';
import { HotUpdateSearchPathService } from '../hotupdate/HotUpdateSearchPathService';
import { HotUpdateStrategyService } from '../hotupdate/HotUpdateStrategyService';
import type { HotUpdateConfig } from '../hotupdate/HotUpdateTypes';
import type { Logger } from '../logger/Logger';
import type { SubGameConfigRecord } from './SubGameConfigTypes';

export interface SubGameHotUpdateResult {
  readonly checked: boolean;
  readonly updated: boolean;
  readonly restartRequired: boolean;
  readonly version: string;
}

export class SubGameHotUpdateService implements Disposable {
  private readonly logger: Logger;
  private readonly eventBus: EventBus<AppEventMap>;
  private readonly adapter: HotUpdateAdapter;
  private readonly searchPathService: HotUpdateSearchPathService;
  private readonly strategyService: HotUpdateStrategyService;

  public constructor(
    logger: Logger,
    eventBus: EventBus<AppEventMap>,
    adapter: HotUpdateAdapter,
    searchPathService: HotUpdateSearchPathService,
    strategyService: HotUpdateStrategyService,
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.adapter = adapter;
    this.searchPathService = searchPathService;
    this.strategyService = strategyService;
  }

  public async checkAndApply(config: SubGameConfigRecord): Promise<SubGameHotUpdateResult> {
    if (!this.strategyService.isSubGameIndependentUpdateEnabled()) {
      const version = this.searchPathService.getBundleVersion(config.bundle);
      this.logger.info('SubGameHotUpdateService', `Subgame independent hot update disabled: ${config.id}`, {
        bundle: config.bundle,
        version,
      });
      return {
        checked: false,
        updated: false,
        restartRequired: false,
        version,
      };
    }

    if (!this.adapter.isSupported()) {
      throw new FrameworkError({
        module: 'SubGameHotUpdateService',
        code: 'UNSUPPORTED',
        message: `Subgame '${config.id}' enables independent hot update, but platform '${this.adapter.platformName}' is unsupported.`,
      });
    }

    const updateConfig = this.buildHotUpdateConfig(config);
    const checkResult = await this.adapter.check(updateConfig);

    if (checkResult.status === 'unsupported') {
      throw new FrameworkError({
        module: 'SubGameHotUpdateService',
        code: 'UNSUPPORTED_RESULT',
        message: `Subgame '${config.id}' hot update check returned unsupported while feature is enabled.`,
      });
    }

    if (checkResult.status === 'up-to-date') {
      this.searchPathService.persistBundleVersion(config.bundle, checkResult.localVersion);
      return {
        checked: true,
        updated: false,
        restartRequired: false,
        version: checkResult.localVersion,
      };
    }

    const updateResult = await this.adapter.update(updateConfig);
    this.eventBus.emit('HotUpdateProgress', { progress: 1 });
    this.searchPathService.persistBundleVersion(config.bundle, updateResult.newVersion);

    return {
      checked: true,
      updated: true,
      restartRequired: updateResult.restartRequired,
      version: updateResult.newVersion,
    };
  }

  public dispose(): void {
    this.adapter.cancel();
  }

  private buildHotUpdateConfig(config: SubGameConfigRecord): HotUpdateConfig {
    const hotUpdate = config.hotUpdate;
    if (!hotUpdate) {
      throw new FrameworkError({
        module: 'SubGameHotUpdateService',
        code: 'CONFIG_MISSING',
        message: `Subgame '${config.id}' hotUpdate config is required when subgame independent update is enabled.`,
      });
    }

    return {
      localManifestPath: Assert.nonEmptyString(
        hotUpdate.localManifestPath,
        `Subgame '${config.id}' hotUpdate.localManifestPath is required when independent hot update is enabled.`,
      ),
      remoteVersionUrl: Assert.nonEmptyString(
        hotUpdate.remoteVersionUrl,
        `Subgame '${config.id}' hotUpdate.remoteVersionUrl is required when independent hot update is enabled.`,
      ),
      remoteManifestUrl: Assert.nonEmptyString(
        hotUpdate.remoteManifestUrl,
        `Subgame '${config.id}' hotUpdate.remoteManifestUrl is required when independent hot update is enabled.`,
      ),
    };
  }
}
