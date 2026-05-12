import { assetManager, AssetManager } from 'cc';
import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';

export class BundleLoader {
  private readonly logger: Logger;
  private readonly bundleCache = new Map<string, AssetManager.Bundle>();
  private readonly bundleVersions = new Map<string, string>();

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
    const existingVersion = this.bundleVersions.get(safeBundleName);
    if (existing && (!existingVersion || existingVersion === safeVersion)) {
      this.bundleCache.set(cacheKey, existing);
      this.bundleVersions.set(safeBundleName, safeVersion);
      return existing;
    }

    if (existing && existingVersion && existingVersion !== safeVersion) {
      assetManager.removeBundle(existing);
      this.clearBundleCache(safeBundleName);
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
    this.bundleVersions.set(safeBundleName, safeVersion);
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
    for (const [bundleName, bundleVersion] of this.bundleVersions.entries()) {
      if (bundleVersion === safeVersion) {
        this.bundleVersions.delete(bundleName);
      }
    }
  }

  public clearAll(): void {
    this.bundleCache.clear();
    this.bundleVersions.clear();
  }

  private clearBundleCache(bundleName: string): void {
    for (const key of this.bundleCache.keys()) {
      if (key.endsWith(`::${bundleName}`)) {
        this.bundleCache.delete(key);
      }
    }
    this.bundleVersions.delete(bundleName);
  }
}
