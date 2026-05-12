import type { Prefab } from 'cc';
import type { Disposable } from '../app/Disposable';
import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';
import { PrefabFactory } from '../resource/PrefabFactory';
import type { ResourceHandle } from '../resource/ResourceHandle';
import type { SubGameConfigProvider, SubGameConfigRecord } from './SubGameConfigTypes';
import { GameplayRootService } from './GameplayRootService';
import { SubGameHotUpdateService } from './SubGameHotUpdateService';
import { SubGameRegistry } from './SubGameRegistry';
import { SubGameResourceScope } from './SubGameResourceScope';
import type {
  SubGameEnterParams,
  SubGameExitReason,
  SubGameExitResult,
  SubGameModule,
  SubGameRuntimeContext,
} from './SubGameTypes';

interface ActiveSubGame {
  readonly module: SubGameModule;
  readonly config: SubGameConfigRecord;
  readonly context: SubGameRuntimeContext;
  readonly entryPrefabHandle: ResourceHandle<Prefab>;
  entered: boolean;
}

export class SubGameLifecycleService implements Disposable {
  private readonly logger: Logger;
  private readonly registry: SubGameRegistry;
  private readonly configProvider: SubGameConfigProvider;
  private readonly hotUpdateService: SubGameHotUpdateService;
  private readonly gameplayRoot: GameplayRootService;
  private readonly resourceScope: SubGameResourceScope;
  private readonly prefabFactory: PrefabFactory;

  private active: ActiveSubGame | null = null;

  public constructor(
    logger: Logger,
    registry: SubGameRegistry,
    configProvider: SubGameConfigProvider,
    hotUpdateService: SubGameHotUpdateService,
    gameplayRoot: GameplayRootService,
    resourceScope: SubGameResourceScope,
    prefabFactory: PrefabFactory = new PrefabFactory(),
  ) {
    this.logger = logger;
    this.registry = registry;
    this.configProvider = configProvider;
    this.hotUpdateService = hotUpdateService;
    this.gameplayRoot = gameplayRoot;
    this.resourceScope = resourceScope;
    this.prefabFactory = prefabFactory;
  }

  public async preload(params: SubGameEnterParams): Promise<SubGameRuntimeContext> {
    if (this.active !== null) {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'SUB_GAME_ALREADY_ACTIVE',
        message: `Subgame '${this.active.context.gameId}' is already active.`,
      });
    }

    const config = this.configProvider.get(params.gameId);
    this.validateConfig(config);
    const module = this.registry.get(config.id);
    const hotUpdateResult = await this.hotUpdateService.checkAndApply(config);
    if (hotUpdateResult.restartRequired) {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'SUB_GAME_RESTART_REQUIRED',
        message: `Subgame '${config.id}' hot update requires restart before entering.`,
      });
    }

    const runId = this.createRunId(params.gameId);
    try {
      const resourceOwnerId = this.resourceScope.begin(config.id, runId, config.bundle);
      const context: SubGameRuntimeContext = {
        ...params,
        gameId: config.id,
        runId,
        resourceOwnerId,
      };

      const entryPrefabHandle = await this.resourceScope.loadPrefab(config.bundle, config.entryPrefab);
      for (const resourcePath of config.preloadResources) {
        await this.resourceScope.loadAsset(config.bundle, resourcePath);
      }

      this.active = {
        module,
        config,
        context,
        entryPrefabHandle,
        entered: false,
      };

      await module.preload(context);
      this.logger.info('SubGameLifecycleService', `Subgame preloaded: ${config.id}`, {
        runId,
        resourceOwnerId,
        bundle: config.bundle,
        bundleVersion: hotUpdateResult.version,
      });
      return context;
    } catch (error) {
      this.cleanupActive();
      throw FrameworkError.fromUnknown(
        'SubGameLifecycleService',
        'PRELOAD_FAILED',
        `Failed to preload subgame '${params.gameId}'.`,
        error,
        { gameId: params.gameId, runId },
      );
    }
  }

  public async enter(context: SubGameRuntimeContext): Promise<void> {
    const active = this.requireActive(context.gameId, context.runId);

    try {
      const gameplayNode = this.prefabFactory.create(active.entryPrefabHandle.asset);
      this.gameplayRoot.attach(gameplayNode);
      await active.module.enter(context);
      active.entered = true;
      this.logger.info('SubGameLifecycleService', `Subgame entered: ${context.gameId}`, {
        runId: context.runId,
      });
    } catch (error) {
      this.cleanupActive();
      throw FrameworkError.fromUnknown(
        'SubGameLifecycleService',
        'ENTER_FAILED',
        `Failed to enter subgame '${context.gameId}'.`,
        error,
        { gameId: context.gameId, runId: context.runId },
      );
    }
  }

  public async exit(reason: SubGameExitReason): Promise<SubGameExitResult> {
    const active = this.requireAnyActive();

    try {
      const result = await active.module.exit(reason);
      this.logger.info('SubGameLifecycleService', `Subgame exited: ${active.context.gameId}`, {
        runId: active.context.runId,
        reason,
      });
      return result;
    } catch (error) {
      throw FrameworkError.fromUnknown(
        'SubGameLifecycleService',
        'EXIT_FAILED',
        `Failed to exit subgame '${active.context.gameId}'.`,
        error,
        {
          gameId: active.context.gameId,
          runId: active.context.runId,
          reason,
        },
      );
    } finally {
      this.cleanupActive();
    }
  }

  public getActiveContext(): SubGameRuntimeContext | null {
    return this.active?.context ?? null;
  }

  public dispose(): void {
    if (this.active !== null) {
      this.cleanupActive();
      return;
    }

    this.resourceScope.releaseAll();
  }

  private requireActive(gameId: string, runId: string): ActiveSubGame {
    const active = this.requireAnyActive();
    if (active.context.gameId !== gameId || active.context.runId !== runId) {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'ACTIVE_SUB_GAME_MISMATCH',
        message: `Active subgame mismatch. active=${active.context.gameId}/${active.context.runId}, requested=${gameId}/${runId}.`,
      });
    }

    return active;
  }

  private requireAnyActive(): ActiveSubGame {
    if (!this.active) {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'NO_ACTIVE_SUB_GAME',
        message: 'No active subgame lifecycle exists.',
      });
    }

    return this.active;
  }

  private cleanupActive(): void {
    try {
      this.gameplayRoot.clear();
      this.resourceScope.releaseAll();
    } finally {
      this.active = null;
    }
  }

  private createRunId(gameId: string): string {
    return `${gameId}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  private validateConfig(config: SubGameConfigRecord): void {
    Assert.nonEmptyString(config.id, 'Subgame config id is required.');
    Assert.nonEmptyString(config.displayName, `Subgame '${config.id}' displayName is required.`);
    Assert.nonEmptyString(config.bundle, `Subgame '${config.id}' bundle is required.`);
    Assert.nonEmptyString(config.entryPrefab, `Subgame '${config.id}' entryPrefab is required.`);
    Assert.nonEmptyString(config.loadingUiId, `Subgame '${config.id}' loadingUiId is required.`);

    if (config.settlementMode !== 'common' && config.settlementMode !== 'custom') {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'INVALID_SETTLEMENT_MODE',
        message: `Subgame '${config.id}' settlementMode is invalid: ${String(config.settlementMode)}.`,
      });
    }

    if (!Array.isArray(config.requiredConfigs)) {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'INVALID_REQUIRED_CONFIGS',
        message: `Subgame '${config.id}' requiredConfigs must be an array.`,
      });
    }

    if (!Array.isArray(config.preloadResources)) {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'INVALID_PRELOAD_RESOURCES',
        message: `Subgame '${config.id}' preloadResources must be an array.`,
      });
    }

    if (config.hotUpdate && typeof config.hotUpdate !== 'object') {
      throw new FrameworkError({
        module: 'SubGameLifecycleService',
        code: 'INVALID_HOT_UPDATE_CONFIG',
        message: `Subgame '${config.id}' hotUpdate must be an object when provided.`,
      });
    }
  }
}
