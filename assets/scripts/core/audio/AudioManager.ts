import { AudioClip, AudioSource } from 'cc';
import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';
import type { ResourceHandle } from '../resource/ResourceHandle';
import { ResourceManager } from '../resource/ResourceManager';
import { AudioConfigRepository } from './AudioConfigRepository';
import { AudioRoot } from './AudioRoot';

export class AudioManager {
  private readonly logger: Logger;
  private readonly resourceManager: ResourceManager;
  private readonly audioConfigRepository: AudioConfigRepository;
  private readonly audioRoot: AudioRoot;

  private readonly clipHandles = new Map<string, ResourceHandle<AudioClip>>();
  private bgmSource: AudioSource;
  private muted = false;

  public constructor(
    logger: Logger,
    resourceManager: ResourceManager,
    audioConfigRepository: AudioConfigRepository,
    audioRoot: AudioRoot,
  ) {
    this.logger = logger;
    this.resourceManager = resourceManager;
    this.audioConfigRepository = audioConfigRepository;
    this.audioRoot = audioRoot;

    this.bgmSource = this.audioRoot.getBgmNode().getComponent(AudioSource) ?? this.audioRoot.getBgmNode().addComponent(AudioSource);
  }

  public async playBgm(key: string, loop: boolean = true): Promise<void> {
    const config = this.audioConfigRepository.getByKey(key);
    const handle = await this.loadClip(config.bundle, config.path, key);

    this.bgmSource.clip = handle.asset;
    this.bgmSource.loop = loop;
    this.bgmSource.volume = this.muted ? 0 : config.defaultVolume;
    this.bgmSource.play();
  }

  public stopBgm(): void {
    this.bgmSource.stop();
  }

  public async playSfx(key: string): Promise<void> {
    const config = this.audioConfigRepository.getByKey(key);
    const handle = await this.loadClip(config.bundle, config.path, key);

    const source = this.audioRoot.getSfxNode().addComponent(AudioSource);
    source.clip = handle.asset;
    source.loop = false;
    source.volume = this.muted ? 0 : config.defaultVolume;
    source.play();

    source.node.once(AudioSource.EventType.ENDED, () => {
      source.destroy();
    });
  }

  public setBgmVolume(volume: number): void {
    this.assertVolume(volume);
    this.bgmSource.volume = this.muted ? 0 : volume;
  }

  public mute(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.bgmSource.volume = 0;
    }
  }

  public dispose(): void {
    this.bgmSource.stop();

    for (const handle of this.clipHandles.values()) {
      if (!handle.isReleased()) {
        handle.dispose();
      }
    }

    this.clipHandles.clear();
    this.logger.info('AudioManager', 'Audio manager disposed.');
  }

  private async loadClip(bundle: string, path: string, key: string): Promise<ResourceHandle<AudioClip>> {
    const cached = this.clipHandles.get(key);
    if (cached) {
      return cached;
    }

    const handle = await this.resourceManager.load<AudioClip>(
      bundle,
      path,
      AudioClip as unknown as typeof import('cc').Asset,
    );

    if (!handle.asset) {
      throw new FrameworkError({
        module: 'AudioManager',
        code: 'AUDIO_CLIP_MISSING',
        message: `Loaded audio clip is empty for key '${key}'.`,
      });
    }

    this.clipHandles.set(key, handle);
    return handle;
  }

  private assertVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new FrameworkError({
        module: 'AudioManager',
        code: 'INVALID_VOLUME',
        message: `Audio volume must be in [0, 1]. got ${volume}`,
      });
    }
  }
}