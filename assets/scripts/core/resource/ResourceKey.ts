import { Assert } from '../error/Assert';

export interface ResourceKey {
  readonly bundle: string;
  readonly path: string;
  readonly type: string;
  readonly version: string;
}

export function createResourceKey(bundle: string, path: string, type: string, version: string): ResourceKey {
  return {
    bundle: Assert.nonEmptyString(bundle, 'Resource bundle name is required.'),
    path: Assert.nonEmptyString(path, 'Resource path is required.'),
    type: Assert.nonEmptyString(type, 'Resource type is required.'),
    version: Assert.nonEmptyString(version, 'Resource version is required.'),
  };
}

export function stringifyResourceKey(key: ResourceKey): string {
  return `${key.version}::${key.bundle}::${key.type}::${key.path}`;
}