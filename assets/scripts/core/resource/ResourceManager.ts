import { Asset, AssetManager, JsonAsset, Prefab } from 'cc';
import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { AppEventMap } from '../event/AppEventMap';
import type { EventBus } from '../event/EventBus';
import type { Logger } from '../logger/Logger';
import { BundleLoader } from './BundleLoader';
import { createResourceKey, stringifyResourceKey } from './ResourceKey';
import { ResourceHandle } from './ResourceHandle';
import type { ResourceVersionProvider } from './ResourceVersionProvider';

interface CachedResourceEntry<TAsset extends Asset> {
  asset: TAsset;
  bundle: AssetManager.Bundle;
  path: string;
  type: typeof Asset;
  refCount: number;
}

export class ResourceManager {
  private readonly logger: Logger;
  private readonly eventBus: EventBus<AppEventMap>;
  private readonly versionProvider: ResourceVersionProvider;
  private readonly bundleLoader: BundleLoader;
  private readonly cache = new Map<string, CachedResourceEntry<Asset>>();

  public constructor(
    logger: Logger,
    eventBus: EventBus<AppEventMap>,
    versionProvider: ResourceVersionProvider,
    bundleLoader?: BundleLoader,
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.versionProvider = versionProvider;
    this.bundleLoader = bundleLoader ?? new BundleLoader(logger);
  }

  public async load<TAsset extends Asset>(
    bundleName: string,
    path: string,
    type: typeof Asset,
  ): Promise<ResourceHandle<TAsset>> {
    const safePath = Assert.nonEmptyString(path, 'Resource path cannot be empty.');
    const version = this.versionProvider.getResourceVersion();
    const key = stringifyResourceKey(createResourceKey(bundleName, safePath, type.name, version));

    const cached = this.cache.get(key);
    if (cached) {
      cached.refCount += 1;
      return this.createHandle(key, cached as CachedResourceEntry<TAsset>);
    }

    const bundle = await this.bundleLoader.loadBundle(bundleName, version);
    const asset = await this.loadFromBundle<TAsset>(bundle, safePath, type);

    const entry: CachedResourceEntry<TAsset> = {
      asset,
      bundle,
      path: safePath,
      type,
      refCount: 1,
    };
    this.cache.set(key, entry as CachedResourceEntry<Asset>);

    this.eventBus.emit('ResourceLoaded', {
      path: safePath,
      type: type.name,
    });

    return this.createHandle(key, entry);
  }

  public async loadPrefab(bundleName: string, path: string): Promise<ResourceHandle<Prefab>> {
    return this.load<Prefab>(bundleName, path, Prefab as unknown as typeof Asset);
  }

  public async loadJson(bundleName: string, path: string): Promise<ResourceHandle<JsonAsset>> {
    return this.load<JsonAsset>(bundleName, path, JsonAsset as unknown as typeof Asset);
  }

  public releaseByKey(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) {
      throw new FrameworkError({
        module: 'ResourceManager',
        code: 'RESOURCE_NOT_FOUND',
        message: `Resource cache key not found: ${key}`,
      });
    }

    entry.refCount -= 1;
    if (entry.refCount < 0) {
      throw new FrameworkError({
        module: 'ResourceManager',
        code: 'NEGATIVE_REF_COUNT',
        message: `Resource refCount went below zero for key '${key}'.`,
      });
    }

    if (entry.refCount === 0) {
      entry.bundle.release(entry.path, entry.type);
      this.cache.delete(key);
    }
  }

  public clearVersionCache(version: string): void {
    const safeVersion = Assert.nonEmptyString(version, 'Version cannot be empty.');
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${safeVersion}::`)) {
        this.releaseAllByExactKey(key);
      }
    }
    this.bundleLoader.clearVersion(safeVersion);
  }

  public dispose(): void {
    for (const key of this.cache.keys()) {
      this.releaseAllByExactKey(key);
    }
    this.bundleLoader.clearAll();
  }

  private createHandle<TAsset extends Asset>(
    key: string,
    entry: CachedResourceEntry<TAsset>,
  ): ResourceHandle<TAsset> {
    return new ResourceHandle<TAsset>(key, entry.asset, () => {
      this.releaseByKey(key);
    });
  }

  private async loadFromBundle<TAsset extends Asset>(
    bundle: AssetManager.Bundle,
    path: string,
    type: typeof Asset,
  ): Promise<TAsset> {
    return new Promise<TAsset>((resolve, reject) => {
      bundle.load(path, type, (error, asset) => {
        if (error || !asset) {
          reject(
            FrameworkError.fromUnknown(
              'ResourceManager',
              'LOAD_RESOURCE_FAILED',
              `Failed to load resource '${path}'.`,
              error,
              {
                path,
                type: type.name,
                bundle: bundle.name,
                version: this.versionProvider.getResourceVersion(),
              },
            ),
          );
          return;
        }

        resolve(asset as TAsset);
      });
    });
  }

  private releaseAllByExactKey(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) {
      return;
    }

    entry.bundle.release(entry.path, entry.type);
    this.cache.delete(key);
  }
}