import { _decorator, Component, Node, director } from 'cc';
import { ConsoleErrorReporter } from '../error/ErrorReporter';
import { EventBus } from '../event/EventBus';
import type { AppEventMap } from '../event/AppEventMap';
import { LogLevel } from '../logger/LogLevel';
import { ConsoleLogger } from '../logger/ConsoleLogger';
import { BundleLoader } from '../resource/BundleLoader';
import { ResourceManager } from '../resource/ResourceManager';
import { ConfigService } from '../config/ConfigService';
import { SaveMigrationPipeline } from '../storage/SaveMigrationPipeline';
import { SaveRepository } from '../storage/SaveRepository';
import { StorageService } from '../storage/StorageService';
import { TimerService } from '../timer/TimerService';
import { NetworkService } from '../network/NetworkService';
import { PlatformService } from '../../platform/PlatformService';
import { WebPlatformAdapter } from '../../platform/WebPlatformAdapter';
import { AudioRoot } from '../audio/AudioRoot';
import { AudioConfigRepository } from '../audio/AudioConfigRepository';
import { AudioManager } from '../audio/AudioManager';
import { UIRoot } from '../ui/UIRoot';
import { UIManager } from '../ui/UIManager';
import { ModuleRegistry } from '../module/ModuleRegistry';
import { GameplayRootService } from '../gameplay/GameplayRootService';
import { SubGameHotUpdateService } from '../gameplay/SubGameHotUpdateService';
import { SubGameLifecycleService } from '../gameplay/SubGameLifecycleService';
import { SubGameRegistry } from '../gameplay/SubGameRegistry';
import { SubGameResourceScope } from '../gameplay/SubGameResourceScope';
import { HotUpdateSearchPathService } from '../hotupdate/HotUpdateSearchPathService';
import { HotUpdateManifestService } from '../hotupdate/HotUpdateManifestService';
import { NativeHotUpdateAdapter } from '../hotupdate/NativeHotUpdateAdapter';
import { HotUpdateService } from '../hotupdate/HotUpdateService';
import { HotUpdateStrategyService } from '../hotupdate/HotUpdateStrategyService';
import { AppContext } from './AppContext';
import { CoreTokens } from './CoreTokens';
import { GameStateMachine } from './GameStateMachine';
import { Assert } from '../error/Assert';
import { ExampleModule } from '../../modules/example';
import { HallModule } from '../../modules/hall';
import { ExampleGameModule } from '../../modules/subgames/exampleGame';
import type { SubGameConfig } from '../../configs/SubGameConfig';
import { SubGameConfigRepository } from '../../configs/SubGameConfigRepository';
import { FrameworkError } from '../error/FrameworkError';

const { ccclass, property } = _decorator;

@ccclass('AppBootstrap')
export class AppBootstrap extends Component {
  private static started = false;

  @property({
    type: Node,
    displayName: 'UI根节点',
    tooltip: '必填。用于承载所有通过 UIManager 打开的界面层级，缺失时启动会直接报错。',
  })
  public uiRootNode: Node | null = null;

  @property({
    type: Node,
    displayName: '音频根节点',
    tooltip: '必填。用于承载 AudioManager 创建的音频组件，缺失时启动会直接报错。',
  })
  public audioRootNode: Node | null = null;

  @property({
    type: Node,
    displayName: '玩法根节点',
    tooltip: '必填。当前子游戏入口 prefab 会挂载到该节点下，退出子游戏时会清空。',
  })
  public gameplayRootNode: Node | null = null;

  @property({
    displayName: '子游戏独立更新',
    tooltip:
      '开启：启动时只更新大厅/公共模块，进入子游戏前单独更新该子游戏 bundle。关闭：启动时全量更新，包含所有子游戏。',
  })
  public subGameIndependentUpdateEnabled = false;

  @property({
    displayName: '大厅壳本地Manifest',
    tooltip: '子游戏独立更新开启时使用。只包含大厅、框架和公共模块的本地 project.manifest 路径。',
  })
  public shellLocalManifestPath = 'hotupdate/shell/project.manifest';

  @property({
    displayName: '大厅壳远端版本',
    tooltip: '子游戏独立更新开启时使用。只包含大厅、框架和公共模块的远端 version.manifest URL。',
  })
  public shellRemoteVersionUrl = 'https://example.com/shell/version.manifest';

  @property({
    displayName: '大厅壳远端Manifest',
    tooltip: '子游戏独立更新开启时使用。只包含大厅、框架和公共模块的远端 project.manifest URL。',
  })
  public shellRemoteManifestUrl = 'https://example.com/shell/project.manifest';

  @property({
    displayName: '全量本地Manifest',
    tooltip: '子游戏独立更新关闭时使用。包含大厅、公共模块和所有子游戏的本地 project.manifest 路径。',
  })
  public fullLocalManifestPath = 'hotupdate/project.manifest';

  @property({
    displayName: '全量远端版本',
    tooltip: '子游戏独立更新关闭时使用。包含大厅、公共模块和所有子游戏的远端 version.manifest URL。',
  })
  public fullRemoteVersionUrl = 'https://example.com/version.manifest';

  @property({
    displayName: '全量远端Manifest',
    tooltip: '子游戏独立更新关闭时使用。包含大厅、公共模块和所有子游戏的远端 project.manifest URL。',
  })
  public fullRemoteManifestUrl = 'https://example.com/project.manifest';

  private context: AppContext | null = null;
  private gameStateMachine: GameStateMachine | null = null;

  protected onLoad(): void {
    if (AppBootstrap.started) {
      throw new Error('AppBootstrap duplicate startup detected.');
    }
    AppBootstrap.started = true;

    director.addPersistRootNode(this.node);

    const logger = new ConsoleLogger(LogLevel.Debug);
    const errorReporter = new ConsoleErrorReporter(logger);
    const eventBus = new EventBus<AppEventMap>({
      allowedEvents: [
        'ConfigLoaded',
        'ResourceLoaded',
        'StateChanged',
        'HotUpdateProgress',
        'NetworkStateChanged',
      ],
    });

    const hotUpdateSearchPathService = new HotUpdateSearchPathService();
    hotUpdateSearchPathService.restorePersistedSearchPaths();
    const hotUpdateStrategyService = new HotUpdateStrategyService({
      subGameIndependentUpdateEnabled: this.subGameIndependentUpdateEnabled,
      shellUpdateConfig: {
        localManifestPath: this.shellLocalManifestPath,
        remoteVersionUrl: this.shellRemoteVersionUrl,
        remoteManifestUrl: this.shellRemoteManifestUrl,
      },
      fullUpdateConfig: {
        localManifestPath: this.fullLocalManifestPath,
        remoteVersionUrl: this.fullRemoteVersionUrl,
        remoteManifestUrl: this.fullRemoteManifestUrl,
      },
    });

    const resourceManager = new ResourceManager(
      logger,
      eventBus,
      hotUpdateSearchPathService,
      new BundleLoader(logger),
    );

    const configService = new ConfigService(resourceManager, logger, eventBus);
    configService.registerManifest<SubGameConfig>({
      name: 'subgame_config',
      bundle: 'resources',
      path: 'configs/subgame_config',
      idField: 'id',
      requiredFields: [
        'id',
        'displayName',
        'bundle',
        'entryPrefab',
        'loadingUiId',
        'settlementMode',
        'requiredConfigs',
        'preloadResources',
        'hotUpdate',
      ],
    });

    const migrationPipeline = new SaveMigrationPipeline();
    const saveRepository = new SaveRepository('framework.save_data');
    const storageService = new StorageService(logger, saveRepository, migrationPipeline, 1);

    const timerService = new TimerService(logger);

    const networkService = new NetworkService(logger, eventBus, timerService);
    networkService.configure({
      env: 'dev',
      httpBaseUrl: 'http://127.0.0.1:8080',
      wsUrl: 'ws://127.0.0.1:8080/ws',
      requestTimeoutMs: 10000,
      protocol: 'json',
      heartbeat: {
        intervalMs: 5000,
        timeoutMs: 15000,
      },
      reconnect: {
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffFactor: 2,
        maxAttempts: 5,
      },
    });

    const platformService = new PlatformService(
      logger,
      new WebPlatformAdapter(async () => {
        const token = localStorage.getItem('framework.dev_access_token');
        if (!token) {
          throw new FrameworkError({
            module: 'AppBootstrap',
            code: 'DEV_TOKEN_MISSING',
            message:
              "Missing localStorage key 'framework.dev_access_token'. Set it before login to avoid mock fallback.",
          });
        }

        return {
          platformUserId: token,
          displayName: 'DevUser',
          accessToken: token,
        };
      }),
    );

    const safeAudioRootNode = Assert.notNull(this.audioRootNode, 'AppBootstrap.audioRootNode is required.');
    const audioRoot = new AudioRoot(safeAudioRootNode);
    const audioConfigRepository = new AudioConfigRepository(configService);
    const audioManager = new AudioManager(logger, resourceManager, audioConfigRepository, audioRoot);

    const safeUiRootNode = Assert.notNull(this.uiRootNode, 'AppBootstrap.uiRootNode is required.');
    const uiRoot = new UIRoot(safeUiRootNode);
    const uiManager = new UIManager(logger, resourceManager, uiRoot);

    const safeGameplayRootNode = Assert.notNull(
      this.gameplayRootNode,
      'AppBootstrap.gameplayRootNode is required.',
    );
    const gameplayRootService = new GameplayRootService(safeGameplayRootNode);
    const subGameRegistry = new SubGameRegistry();
    const subGameConfigRepository = new SubGameConfigRepository(configService);
    const subGameHotUpdateService = new SubGameHotUpdateService(
      logger,
      eventBus,
      new NativeHotUpdateAdapter(),
      hotUpdateSearchPathService,
      hotUpdateStrategyService,
    );
    const subGameResourceScope = new SubGameResourceScope(resourceManager, hotUpdateSearchPathService);
    const subGameLifecycleService = new SubGameLifecycleService(
      logger,
      subGameRegistry,
      subGameConfigRepository,
      subGameHotUpdateService,
      gameplayRootService,
      subGameResourceScope,
    );

    const hotUpdateManifestService = new HotUpdateManifestService();
    hotUpdateManifestService.setConfig(hotUpdateStrategyService.getStartupUpdateConfig());

    const hotUpdateService = new HotUpdateService(
      logger,
      eventBus,
      new NativeHotUpdateAdapter(),
      hotUpdateManifestService,
      hotUpdateSearchPathService,
    );

    const moduleRegistry = new ModuleRegistry(logger);
    moduleRegistry.register(new ExampleModule());
    moduleRegistry.register(new HallModule());

    const exampleGameModule = new ExampleGameModule();
    moduleRegistry.register(exampleGameModule);
    subGameRegistry.register(exampleGameModule);

    const context = new AppContext();
    context.register(CoreTokens.Logger, logger);
    context.register(CoreTokens.ErrorReporter, errorReporter);
    context.register(CoreTokens.EventBus, eventBus);
    context.register(CoreTokens.ResourceManager, resourceManager);
    context.register(CoreTokens.ConfigService, configService);
    context.register(CoreTokens.StorageService, storageService);
    context.register(CoreTokens.PlatformService, platformService);
    context.register(CoreTokens.AudioManager, audioManager);
    context.register(CoreTokens.TimerService, timerService);
    context.register(CoreTokens.UIManager, uiManager);
    context.register(CoreTokens.HotUpdateService, hotUpdateService);
    context.register(CoreTokens.HotUpdateStrategyService, hotUpdateStrategyService);
    context.register(CoreTokens.NetworkService, networkService);
    context.register(CoreTokens.ModuleRegistry, moduleRegistry);
    context.register(CoreTokens.GameplayRootService, gameplayRootService);
    context.register(CoreTokens.SubGameConfigProvider, subGameConfigRepository);
    context.register(CoreTokens.SubGameHotUpdateService, subGameHotUpdateService);
    context.register(CoreTokens.SubGameRegistry, subGameRegistry);
    context.register(CoreTokens.SubGameLifecycleService, subGameLifecycleService);

    this.context = context;
    this.gameStateMachine = new GameStateMachine(context);
    context.register(CoreTokens.GameStateMachine, this.gameStateMachine);
  }

  protected async start(): Promise<void> {
    const context = Assert.notNull(this.context, 'AppContext is not initialized.');
    const moduleRegistry = context.get(CoreTokens.ModuleRegistry);
    await moduleRegistry.initAll(context);
    await moduleRegistry.startAll();

    await Assert.notNull(this.gameStateMachine, 'GameStateMachine is not initialized.').start();
  }

  protected update(deltaTime: number): void {
    this.gameStateMachine?.update(deltaTime);
  }

  protected onDestroy(): void {
    if (this.context) {
      this.context.dispose();
      this.context = null;
    }

    this.gameStateMachine = null;
    AppBootstrap.started = false;
  }
}
