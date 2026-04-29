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
import { HotUpdateSearchPathService } from '../hotupdate/HotUpdateSearchPathService';
import { HotUpdateManifestService } from '../hotupdate/HotUpdateManifestService';
import { NativeHotUpdateAdapter } from '../hotupdate/NativeHotUpdateAdapter';
import { HotUpdateService } from '../hotupdate/HotUpdateService';
import { AppContext } from './AppContext';
import { CoreTokens } from './CoreTokens';
import { GameStateMachine } from './GameStateMachine';
import { Assert } from '../error/Assert';
import { ExampleModule } from '../../modules/example';
import { FrameworkError } from '../error/FrameworkError';

const { ccclass, property } = _decorator;

@ccclass('AppBootstrap')
export class AppBootstrap extends Component {
  private static started = false;

  @property(Node)
  public uiRootNode: Node | null = null;

  @property(Node)
  public audioRootNode: Node | null = null;

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

    const resourceManager = new ResourceManager(
      logger,
      eventBus,
      hotUpdateSearchPathService,
      new BundleLoader(logger),
    );

    const configService = new ConfigService(resourceManager, logger, eventBus);

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

    const hotUpdateManifestService = new HotUpdateManifestService();
    hotUpdateManifestService.setConfig({
      localManifestPath: 'hotupdate/project.manifest',
      remoteVersionUrl: 'https://example.com/version.manifest',
      remoteManifestUrl: 'https://example.com/project.manifest',
    });

    const hotUpdateService = new HotUpdateService(
      logger,
      eventBus,
      new NativeHotUpdateAdapter(),
      hotUpdateManifestService,
      hotUpdateSearchPathService,
    );

    const moduleRegistry = new ModuleRegistry(logger);
    moduleRegistry.register(new ExampleModule());

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
    context.register(CoreTokens.NetworkService, networkService);
    context.register(CoreTokens.ModuleRegistry, moduleRegistry);

    this.context = context;
    this.gameStateMachine = new GameStateMachine(context);
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
