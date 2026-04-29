import { FrameworkError } from '../error/FrameworkError';
import type { HotUpdateAdapter } from './HotUpdateAdapter';
import type {
  HotUpdateApplyResult,
  HotUpdateCheckResult,
  HotUpdateConfig,
} from './HotUpdateTypes';

declare const jsb: unknown;

export class NativeHotUpdateAdapter implements HotUpdateAdapter {
  public readonly platformName = 'native';

  public isSupported(): boolean {
    return typeof jsb !== 'undefined';
  }

  public async check(_config: HotUpdateConfig): Promise<HotUpdateCheckResult> {
    if (!this.isSupported()) {
      return {
        status: 'unsupported',
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
      };
    }

    throw new FrameworkError({
      module: 'NativeHotUpdateAdapter',
      code: 'NOT_IMPLEMENTED',
      message: 'Native hot update check is not implemented yet.',
    });
  }

  public async update(_config: HotUpdateConfig): Promise<HotUpdateApplyResult> {
    if (!this.isSupported()) {
      throw new FrameworkError({
        module: 'NativeHotUpdateAdapter',
        code: 'UNSUPPORTED',
        message: 'Hot update is unsupported on this platform.',
      });
    }

    throw new FrameworkError({
      module: 'NativeHotUpdateAdapter',
      code: 'NOT_IMPLEMENTED',
      message: 'Native hot update apply is not implemented yet.',
    });
  }

  public cancel(): void {
    return;
  }
}