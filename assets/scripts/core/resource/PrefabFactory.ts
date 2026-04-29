import { instantiate, Node, Prefab } from 'cc';
import { Assert } from '../error/Assert';

export class PrefabFactory {
  public create(prefab: Prefab): Node {
    Assert.notNull(prefab, 'Cannot instantiate null prefab.');
    return instantiate(prefab);
  }
}