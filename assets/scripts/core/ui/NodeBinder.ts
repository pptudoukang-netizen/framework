import { Component, Node } from 'cc';
import { Assert } from '../error/Assert';

export class NodeBinder {
  public static requiredNode(root: Node, relativePath: string): Node {
    const safeRoot = Assert.notNull(root, 'NodeBinder root node is required.');
    const safePath = Assert.nonEmptyString(relativePath, 'NodeBinder relative path is required.');

    const segments = safePath.split('/').filter((segment) => segment.length > 0);
    let cursor: Node | null = safeRoot;

    for (const segment of segments) {
      cursor = cursor.getChildByName(segment);
      Assert.notNull(cursor, `Required node missing: '${relativePath}'.`, {
        currentSegment: segment,
      });
    }

    return Assert.notNull(cursor, `Required node missing: '${relativePath}'.`);
  }

  public static requiredComponent<T extends Component>(node: Node, ctor: new () => T): T {
    const safeNode = Assert.notNull(node, 'Node cannot be null when binding component.');
    const component = safeNode.getComponent(ctor);
    return Assert.notNull(component, `Required component '${ctor.name}' missing on node '${safeNode.name}'.`);
  }
}