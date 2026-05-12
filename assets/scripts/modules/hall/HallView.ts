import { _decorator } from 'cc';
import { UIView } from '../../core/ui/UIView';
import { HallController } from './HallController';
import type { HallSubGameEntry, HallViewContract } from './HallTypes';

const { ccclass } = _decorator;

@ccclass('HallView')
export class HallView extends UIView<void> implements HallViewContract {
  private controller: HallController | null = null;

  public bindController(controller: HallController): void {
    this.controller = controller;
    controller.bindView(this);
  }

  public renderEntries(_entries: readonly HallSubGameEntry[]): void {
    return;
  }

  protected bindNodes(): void {
    return;
  }

  protected bindEvents(): void {
    return;
  }

  protected render(): void {
    this.getController().refresh();
  }

  protected onOpen(): void {
    this.getController().refresh();
  }

  private getController(): HallController {
    if (!this.controller) {
      throw new Error('HallView controller is not bound.');
    }

    return this.controller;
  }
}
