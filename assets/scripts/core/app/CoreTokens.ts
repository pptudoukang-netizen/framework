import type { AppEventMap } from '../event/AppEventMap';
import type { EventBus } from '../event/EventBus';
import type { ErrorReporter } from '../error/ErrorReporter';
import type { Logger } from '../logger/Logger';
import type { AudioManager } from '../audio/AudioManager';
import type { ConfigService } from '../config/ConfigService';
import type { HotUpdateService } from '../hotupdate/HotUpdateService';
import type { ModuleRegistry } from '../module/ModuleRegistry';
import type { NetworkService } from '../network/NetworkService';
import type { ResourceManager } from '../resource/ResourceManager';
import type { StorageService } from '../storage/StorageService';
import type { TimerService } from '../timer/TimerService';
import type { UIManager } from '../ui/UIManager';
import type { PlatformService } from '../../platform/PlatformService';
import { createServiceToken } from './ServiceToken';

export const CoreTokens = {
  Logger: createServiceToken<Logger>('Logger'),
  ErrorReporter: createServiceToken<ErrorReporter>('ErrorReporter'),
  EventBus: createServiceToken<EventBus<AppEventMap>>('EventBus'),
  ResourceManager: createServiceToken<ResourceManager>('ResourceManager'),
  ConfigService: createServiceToken<ConfigService>('ConfigService'),
  StorageService: createServiceToken<StorageService>('StorageService'),
  PlatformService: createServiceToken<PlatformService>('PlatformService'),
  AudioManager: createServiceToken<AudioManager>('AudioManager'),
  TimerService: createServiceToken<TimerService>('TimerService'),
  UIManager: createServiceToken<UIManager>('UIManager'),
  HotUpdateService: createServiceToken<HotUpdateService>('HotUpdateService'),
  NetworkService: createServiceToken<NetworkService>('NetworkService'),
  ModuleRegistry: createServiceToken<ModuleRegistry>('ModuleRegistry'),
} as const;