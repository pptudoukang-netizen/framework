import { Node } from 'cc';
import { Assert } from '../error/Assert';
import { UILayer } from './UILayer';

export class UIRoot {
  private readonly rootNode: Node;
  private readonly layers = new Map<UILayer, Node>();

  public constructor(rootNode: Node) {
    this.rootNode = Assert.notNull(rootNode, 'UIRoot root node is required.');
    this.ensureLayers();
  }

  public getLayerNode(layer: UILayer): Node {
    const layerNode = this.layers.get(layer);
    return Assert.notNull(layerNode, `UI layer node is missing: ${layer}`);
  }

  private ensureLayers(): void {
    const orderedLayers: UILayer[] = [
      UILayer.Background,
      UILayer.Normal,
      UILayer.Popup,
      UILayer.Top,
      UILayer.System,
    ];

    for (const layer of orderedLayers) {
      let child = this.rootNode.getChildByName(layer);
      if (!child) {
        child = new Node(layer);
        this.rootNode.addChild(child);
      }
      this.layers.set(layer, child);
    }
  }
}