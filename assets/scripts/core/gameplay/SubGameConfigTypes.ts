export type SubGameSettlementMode = 'common' | 'custom';

export interface SubGameHotUpdateConfig {
  readonly localManifestPath?: string;
  readonly remoteVersionUrl?: string;
  readonly remoteManifestUrl?: string;
}

export interface SubGameConfigRecord extends Record<string, unknown> {
  readonly id: string;
  readonly displayName: string;
  readonly bundle: string;
  readonly entryPrefab: string;
  readonly loadingUiId: string;
  readonly settlementMode: SubGameSettlementMode;
  readonly requiredConfigs: readonly string[];
  readonly preloadResources: readonly string[];
  readonly hotUpdate?: SubGameHotUpdateConfig;
}

export interface SubGameConfigProvider {
  get(gameId: string): SubGameConfigRecord;
  getAll(): readonly SubGameConfigRecord[];
}
