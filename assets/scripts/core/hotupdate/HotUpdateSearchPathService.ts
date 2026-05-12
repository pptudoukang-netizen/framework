import { sys } from 'cc';
import { Assert } from '../error/Assert';
import type { ResourceVersionProvider } from '../resource/ResourceVersionProvider';

export class HotUpdateSearchPathService implements ResourceVersionProvider {
  private static readonly STORAGE_KEY = 'framework.hotupdate.searchPaths';
  private static readonly VERSION_KEY = 'framework.hotupdate.version';
  private static readonly BUNDLE_VERSION_KEY = 'framework.hotupdate.bundleVersions';

  private version = 'base';
  private searchPaths: string[] = [];
  private readonly bundleVersions = new Map<string, string>();

  public getResourceVersion(): string {
    return this.version;
  }

  public getBundleVersion(bundleName: string): string {
    const safeBundleName = Assert.nonEmptyString(bundleName, 'Bundle name cannot be empty.');
    return this.bundleVersions.get(safeBundleName) ?? this.version;
  }

  public getSearchPaths(): readonly string[] {
    return this.searchPaths;
  }

  public applySearchPaths(paths: string[], version: string): void {
    this.searchPaths = [...paths];
    this.version = Assert.nonEmptyString(version, 'Hot update version cannot be empty.');
  }

  public applyBundleVersion(bundleName: string, version: string): void {
    const safeBundleName = Assert.nonEmptyString(bundleName, 'Bundle name cannot be empty.');
    const safeVersion = Assert.nonEmptyString(version, 'Bundle hot update version cannot be empty.');
    this.bundleVersions.set(safeBundleName, safeVersion);
  }

  public persistSearchPaths(paths: string[], version: string): void {
    this.applySearchPaths(paths, version);
    sys.localStorage.setItem(HotUpdateSearchPathService.STORAGE_KEY, JSON.stringify(this.searchPaths));
    sys.localStorage.setItem(HotUpdateSearchPathService.VERSION_KEY, this.version);
  }

  public persistBundleVersion(bundleName: string, version: string): void {
    this.applyBundleVersion(bundleName, version);
    sys.localStorage.setItem(
      HotUpdateSearchPathService.BUNDLE_VERSION_KEY,
      JSON.stringify(Object.fromEntries(this.bundleVersions.entries())),
    );
  }

  public restorePersistedSearchPaths(): void {
    const rawPaths = sys.localStorage.getItem(HotUpdateSearchPathService.STORAGE_KEY);
    const rawVersion = sys.localStorage.getItem(HotUpdateSearchPathService.VERSION_KEY);
    const rawBundleVersions = sys.localStorage.getItem(HotUpdateSearchPathService.BUNDLE_VERSION_KEY);

    if (!rawPaths || !rawVersion) {
      this.searchPaths = [];
      this.version = 'base';
    } else {
      const parsed = JSON.parse(rawPaths);
      if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
        throw new Error('Persisted hot update search paths are invalid.');
      }

      this.searchPaths = [...parsed];
      this.version = Assert.nonEmptyString(rawVersion, 'Persisted hot update version is invalid.');
    }

    this.bundleVersions.clear();
    if (!rawBundleVersions) {
      return;
    }

    const parsedBundleVersions = JSON.parse(rawBundleVersions) as Record<string, unknown>;
    if (
      !parsedBundleVersions ||
      typeof parsedBundleVersions !== 'object' ||
      Array.isArray(parsedBundleVersions)
    ) {
      throw new Error('Persisted hot update bundle versions are invalid.');
    }

    for (const [bundleName, version] of Object.entries(parsedBundleVersions)) {
      if (typeof version !== 'string') {
        throw new Error(`Persisted hot update bundle version is invalid: ${bundleName}.`);
      }
      this.applyBundleVersion(bundleName, version);
    }
  }
}
