import { _decorator, Label, Node } from 'cc';
import { Assert } from '../../../core/error/Assert';
import { NodeBinder } from '../../../core/ui/NodeBinder';
import { UIView } from '../../../core/ui/UIView';
import { ExampleGameController } from './ExampleGameController';
import type { ExampleGameViewContract } from './ExampleGameTypes';

const { ccclass, property } = _decorator;

@ccclass('ExampleGameView')
export class ExampleGameView extends UIView<void> implements ExampleGameViewContract {
  @property(Node)
  public contentRoot: Node | null = null;

  private controller: ExampleGameController | null = null;
  private runIdLabel: Label | null = null;

  public bindController(controller: ExampleGameController): void {
    this.controller = controller;
    controller.bindView(this);
  }

  public renderRunId(runId: string): void {
    const label = Assert.notNull(this.runIdLabel, 'ExampleGameView.runIdLabel is required.');
    label.string = runId;
  }

  protected bindNodes(): void {
    const root = Assert.notNull(this.contentRoot, 'ExampleGameView.contentRoot is required.');
    const labelNode = NodeBinder.requiredNode(root, 'RunIdLabel');
    this.runIdLabel = NodeBinder.requiredComponent(labelNode, Label);
  }

  protected bindEvents(): void {
    return;
  }

  protected render(): void {
    this.controller?.refresh();
  }

  protected onOpen(): void {
    if (!this.controller) {
      throw new Error('ExampleGameView controller is not bound.');
    }

    this.controller.refresh();
  }
}
