import { Node } from 'cc';
import { Assert } from '../error/Assert';

export class AudioRoot {
  private readonly rootNode: Node;
  private readonly bgmNode: Node;
  private readonly sfxNode: Node;

  public constructor(rootNode: Node) {
    this.rootNode = Assert.notNull(rootNode, 'Audio root node is required.');
    this.bgmNode = this.ensureChild('Bgm');
    this.sfxNode = this.ensureChild('Sfx');
  }

  public getBgmNode(): Node {
    return this.bgmNode;
  }

  public getSfxNode(): Node {
    return this.sfxNode;
  }

  private ensureChild(name: string): Node {
    let child = this.rootNode.getChildByName(name);
    if (!child) {
      child = new Node(name);
      this.rootNode.addChild(child);
    }
    return child;
  }
}