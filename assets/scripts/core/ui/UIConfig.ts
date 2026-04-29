import type { UILayer } from './UILayer';

export interface UIConfig {
  readonly id: string;
  readonly bundle: string;
  readonly prefabPath: string;
  readonly layer: UILayer;
  readonly cachePrefab?: boolean;
}