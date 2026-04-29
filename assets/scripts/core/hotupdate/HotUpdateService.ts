import type { AppEventMap } from '../event/AppEventMap';
import type { EventBus } from '../event/EventBus';
import type { Logger } from '../logger/Logger';
import type { HotUpdateAdapter } from './HotUpdateAdapter';
import { HotUpdateManifestService } from './HotUpdateManifestService';
import { HotUpdateSearchPathService } from './HotUpdateSearchPathService';
import type { HotUpdateApplyResult, HotUpdateCheckResult } from './HotUpdateTypes';

export class HotUpdateService {
  private readonly logger: Logger;
  private readonly eventBus: EventBus<AppEventMap>;
  private readonly adapter: HotUpdateAdapter;
  private readonly manifestService: HotUpdateManifestService;
  private readonly searchPathService: HotUpdateSearchPathService;

  public constructor(
    logger: Logger,
    eventBus: EventBus<AppEventMap>,
    adapter: HotUpdateAdapter,
    manifestService: HotUpdateManifestService,
    searchPathService: HotUpdateSearchPathService,
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.adapter = adapter;
    this.manifestService = manifestService;
    this.searchPathService = searchPathService;
  }

  public async checkForUpdate(): Promise<HotUpdateCheckResult> {
    if (!this.adapter.isSupported()) {
      this.logger.info('HotUpdateService', 'Hot update unsupported, skip check.');
      return {
        status: 'unsupported',
        localVersion: this.searchPathService.getResourceVersion(),
        remoteVersion: this.searchPathService.getResourceVersion(),
      };
    }

    const config = this.manifestService.getConfig();
    return this.adapter.check(config);
  }

  public async applyUpdate(): Promise<HotUpdateApplyResult> {
    const config = this.manifestService.getConfig();
    const result = await this.adapter.update(config);

    this.eventBus.emit('HotUpdateProgress', { progress: 1 });
    this.searchPathService.applySearchPaths(this.searchPathService.getSearchPaths().slice(), result.newVersion);

    return result;
  }

  public dispose(): void {
    this.adapter.cancel();
  }
}