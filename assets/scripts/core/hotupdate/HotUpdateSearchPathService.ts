import { sys } from 'cc';
import { Assert } from '../error/Assert';
import type { ResourceVersionProvider } from '../resource/ResourceVersionProvider';

export class HotUpdateSearchPathService implements ResourceVersionProvider {
  private static readonly STORAGE_KEY = 'framework.hotupdate.searchPaths';
  private static readonly VERSION_KEY = 'framework.hotupdate.version';

  private version = 'base';
  private searchPaths: string[] = [];

  public getResourceVersion(): string {
    return this.version;
  }

  public getSearchPaths(): readonly string[] {
    return this.searchPaths;
  }

  public applySearchPaths(paths: string[], version: string): void {
    this.searchPaths = [...paths];
    this.version = Assert.nonEmptyString(version, 'Hot update version cannot be empty.');
  }

  public persistSearchPaths(paths: string[], version: string): void {
    this.applySearchPaths(paths, version);
    sys.localStorage.setItem(HotUpdateSearchPathService.STORAGE_KEY, JSON.stringify(this.searchPaths));
    sys.localStorage.setItem(HotUpdateSearchPathService.VERSION_KEY, this.version);
  }

  public restorePersistedSearchPaths(): void {
    const rawPaths = sys.localStorage.getItem(HotUpdateSearchPathService.STORAGE_KEY);
    const rawVersion = sys.localStorage.getItem(HotUpdateSearchPathService.VERSION_KEY);

    if (!rawPaths || !rawVersion) {
      this.searchPaths = [];
      this.version = 'base';
      return;
    }

    const parsed = JSON.parse(rawPaths);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      throw new Error('Persisted hot update search paths are invalid.');
    }

    this.searchPaths = [...parsed];
    this.version = Assert.nonEmptyString(rawVersion, 'Persisted hot update version is invalid.');
  }
}