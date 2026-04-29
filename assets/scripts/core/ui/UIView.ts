import { _decorator } from 'cc';
import { FrameworkError } from '../error/FrameworkError';
import { BaseView } from './BaseView';

const { ccclass } = _decorator;

@ccclass('UIView')
export abstract class UIView<TOpenParams = void> extends BaseView {
  private closeHandler: (() => void) | null = null;

  public open(params: TOpenParams): void {
    this.onOpen(params);
    this.show();
  }

  public close(): void {
    if (!this.closeHandler) {
      throw new FrameworkError({
        module: this.constructor.name,
        code: 'CLOSE_HANDLER_MISSING',
        message: `${this.constructor.name} close handler is not bound.`,
      });
    }

    this.closeHandler();
  }

  public __internalSetCloseHandler(handler: () => void): void {
    this.closeHandler = handler;
  }

  protected abstract onOpen(params: TOpenParams): void;
}