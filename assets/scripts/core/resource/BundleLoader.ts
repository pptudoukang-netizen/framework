import { assetManager, AssetManager } from 'cc';
import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';

export class BundleLoader {
  private readonly logger: Logger;
  private readonly bundleCache = new Map<string, AssetManager.Bundle>();

  public constructor(logger: Logger) {
    this.logger = logger;
  }

  public async loadBundle(bundleName: string, version: string): Promise<AssetManager.Bundle> {
    const safeBundleName = Assert.nonEmptyString(bundleName, 'Bundle name cannot be empty.');
    const safeVersion = Assert.nonEmptyString(version, 'Bundle version cannot be empty.');
    const cacheKey = `${safeVersion}::${safeBundleName}`;

    const cached = this.bundleCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const existing = assetManager.getBundle(safeBundleName);
    if (existing) {
      this.bundleCache.set(cacheKey, existing);
      return existing;
    }

    const bundle = await new Promise<AssetManager.Bundle>((resolve, reject) => {
      assetManager.loadBundle(safeBundleName, (error, loadedBundle) => {
        if (error || !loadedBundle) {
          reject(
            FrameworkError.fromUnknown(
              'BundleLoader',
              'LOAD_BUNDLE_FAILED',
              `Failed to load bundle '${safeBundleName}'.`,
              error,
              { bundleName: safeBundleName, version: safeVersion },
            ),
          );
          return;
        }

        resolve(loadedBundle);
      });
    });

    this.bundleCache.set(cacheKey, bundle);
    this.logger.info('BundleLoader', `Bundle loaded: ${safeBundleName}`, {
      version: safeVersion,
    });

    return bundle;
  }

  public clearVersion(version: string): void {
    const safeVersion = Assert.nonEmptyString(version, 'Version cannot be empty.');
    for (const key of this.bundleCache.keys()) {
      if (key.startsWith(`${safeVersion}::`)) {
        this.bundleCache.delete(key);
      }
    }
  }

  public clearAll(): void {
    this.bundleCache.clear();
  }
}