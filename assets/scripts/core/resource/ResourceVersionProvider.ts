export interface ResourceVersionProvider {
  getResourceVersion(): string;
  getBundleVersion(bundleName: string): string;
  getSearchPaths(): readonly string[];
}

export class StaticResourceVersionProvider implements ResourceVersionProvider {
  private readonly version: string;
  private readonly searchPaths: readonly string[];

  public constructor(version: string = 'base', searchPaths: readonly string[] = []) {
    this.version = version;
    this.searchPaths = searchPaths;
  }

  public getResourceVersion(): string {
    return this.version;
  }

  public getBundleVersion(_bundleName: string): string {
    return this.version;
  }

  public getSearchPaths(): readonly string[] {
    return this.searchPaths;
  }
}
