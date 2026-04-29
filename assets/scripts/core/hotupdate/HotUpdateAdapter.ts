import type {
  HotUpdateApplyResult,
  HotUpdateCheckResult,
  HotUpdateConfig,
} from './HotUpdateTypes';

export interface HotUpdateAdapter {
  readonly platformName: string;
  isSupported(): boolean;
  check(config: HotUpdateConfig): Promise<HotUpdateCheckResult>;
  update(config: HotUpdateConfig): Promise<HotUpdateApplyResult>;
  cancel(): void;
}