import { Asset, JsonAsset, Prefab } from 'cc';
import type { Disposable } from '../app/Disposable';
import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { ResourceHandle } from '../resource/ResourceHandle';
import { ResourceManager } from '../resource/ResourceManager';
import type { ResourceVersionProvider } from '../resource/ResourceVersionProvider';

export class SubGameResourceScope implements Disposable {
  private readonly resourceManager: ResourceManager;
  private readonly versionProvider: ResourceVersionProvider;
  private readonly handles: ResourceHandle<Asset>[] = [];
  private ownerId: string | null = null;

  public constructor(resourceManager: ResourceManager, versionProvider: ResourceVersionProvider) {
    this.resourceManager = resourceManager;
    this.versionProvider = versionProvider;
  }

  public begin(gameId: string, runId: string, bundleName: string): string {
    if (this.ownerId !== null) {
      throw new FrameworkError({
        module: 'SubGameResourceScope',
        code: 'SCOPE_ALREADY_ACTIVE',
        message: `Subgame resource scope is already active: '${this.ownerId}'.`,
      });
    }

    const safeGameId = Assert.nonEmptyString(gameId, 'Subgame resource gameId cannot be empty.');
    const safeRunId = Assert.nonEmptyString(runId, 'Subgame resource runId cannot be empty.');
    const safeBundleName = Assert.nonEmptyString(bundleName, 'Subgame resource bundleName cannot be empty.');
    const version = Assert.nonEmptyString(
      this.versionProvider.getBundleVersion(safeBundleName),
      'Subgame resource version cannot be empty.',
    );

    this.ownerId = `subgame:${safeGameId}:${safeRunId}:${version}`;
    return this.ownerId;
  }

  public getOwnerId(): string {
    return Assert.notNull(this.ownerId, 'Subgame resource scope is not active.');
  }

  public async loadPrefab(bundleName: string, path: string): Promise<ResourceHandle<Prefab>> {
    const handle = await this.resourceManager.loadPrefab(bundleName, path);
    return this.track(handle);
  }

  public async loadJson(bundleName: string, path: string): Promise<ResourceHandle<JsonAsset>> {
    const handle = await this.resourceManager.loadJson(bundleName, path);
    return this.track(handle);
  }

  public async loadAsset(bundleName: string, path: string): Promise<ResourceHandle<Asset>> {
    const handle = await this.resourceManager.load<Asset>(bundleName, path, Asset);
    return this.track(handle);
  }

  public track<TAsset extends Asset>(handle: ResourceHandle<TAsset>): ResourceHandle<TAsset> {
    this.getOwnerId();
    this.handles.push(handle as unknown as ResourceHandle<Asset>);
    return handle;
  }

  public releaseAll(): void {
    const errors: Error[] = [];

    for (const handle of this.handles.splice(0)) {
      if (handle.isReleased()) {
        continue;
      }

      try {
        handle.dispose();
      } catch (error) {
        errors.push(error as Error);
      }
    }

    this.ownerId = null;

    if (errors.length > 0) {
      throw new FrameworkError({
        module: 'SubGameResourceScope',
        code: 'RELEASE_FAILED',
        message: 'Failed to release one or more subgame resources.',
        details: {
          errors: errors.map((error) => error.message),
        },
      });
    }
  }

  public dispose(): void {
    this.releaseAll();
  }
}
