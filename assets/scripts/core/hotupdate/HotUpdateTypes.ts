export type HotUpdateCheckStatus = 'up-to-date' | 'update-required' | 'unsupported';

export interface HotUpdateConfig {
  readonly localManifestPath: string;
  readonly remoteVersionUrl: string;
  readonly remoteManifestUrl: string;
}

export interface HotUpdateStrategyConfig {
  readonly subGameIndependentUpdateEnabled: boolean;
  readonly shellUpdateConfig: HotUpdateConfig;
  readonly fullUpdateConfig: HotUpdateConfig;
}

export interface HotUpdateCheckResult {
  readonly status: HotUpdateCheckStatus;
  readonly localVersion: string;
  readonly remoteVersion: string;
}

export interface HotUpdateApplyResult {
  readonly restartRequired: boolean;
  readonly newVersion: string;
}
