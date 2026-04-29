import { _decorator, Label, Node } from 'cc';
import { Assert } from '../../core/error/Assert';
import { NodeBinder } from '../../core/ui/NodeBinder';
import { UIView } from '../../core/ui/UIView';
import type { ExampleViewContract } from './ExampleTypes';
import { ExampleController } from './ExampleController';

const { ccclass, property } = _decorator;

@ccclass('ExampleView')
export class ExampleView extends UIView<void> implements ExampleViewContract {
  @property(Node)
  public contentRoot: Node | null = null;

  private countLabel: Label | null = null;
  private exampleController: ExampleController | null = null;

  protected bindNodes(): void {
    const root = Assert.notNull(this.contentRoot, 'ExampleView.contentRoot is required.');
    const labelNode = NodeBinder.requiredNode(root, 'CountLabel');
    this.countLabel = NodeBinder.requiredComponent(labelNode, Label);
  }

  protected bindEvents(): void {
    return;
  }

  protected render(): void {
    if (!this.exampleController || !this.countLabel) {
      return;
    }
    this.exampleController.refresh();
  }

  protected onOpen(): void {
    if (!this.exampleController) {
      throw new Error('ExampleView controller is not bound.');
    }
    this.exampleController.refresh();
  }

  public bindController(controller: ExampleController): void {
    this.exampleController = controller;
    controller.bindView(this);
  }

  public renderCount(count: number): void {
    const label = Assert.notNull(this.countLabel, 'ExampleView.countLabel is required.');
    label.string = `${count}`;
  }
}
