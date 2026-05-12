import { Node } from 'cc';
import type { Disposable } from '../app/Disposable';
import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';

export class GameplayRootService implements Disposable {
  private readonly rootNode: Node;

  public constructor(rootNode: Node) {
    this.rootNode = Assert.notNull(rootNode, 'GameplayRoot node is required.');
  }

  public getRootNode(): Node {
    return this.rootNode;
  }

  public attach(node: Node): void {
    const safeNode = Assert.notNull(node, 'Gameplay node cannot be null.');
    if (safeNode.parent) {
      throw new FrameworkError({
        module: 'GameplayRootService',
        code: 'NODE_ALREADY_ATTACHED',
        message: `Gameplay node '${safeNode.name}' already has a parent.`,
      });
    }

    this.rootNode.addChild(safeNode);
  }

  public clear(): void {
    const children = [...this.rootNode.children];
    for (const child of children) {
      child.destroy();
    }
  }

  public dispose(): void {
    this.clear();
  }
}
