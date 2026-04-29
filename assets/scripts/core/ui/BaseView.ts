import { _decorator, Component } from 'cc';
import type { Disposable } from '../app/Disposable';
import { Assert } from '../error/Assert';

const { ccclass } = _decorator;

@ccclass('BaseView')
export abstract class BaseView extends Component {
  private readonly disposables: Disposable[] = [];
  private controller: unknown;

  protected abstract bindNodes(): void;
  protected abstract bindEvents(): void;
  protected abstract render(): void;

  protected onLoad(): void {
    this.bindNodes();
    this.bindEvents();
  }

  protected onDestroy(): void {
    for (const disposable of this.disposables.splice(0)) {
      disposable.dispose();
    }
  }

  public show(): void {
    this.node.active = true;
    this.render();
  }

  public hide(): void {
    this.node.active = false;
  }

  public setController(controller: unknown): void {
    this.controller = Assert.notNull(controller, `${this.constructor.name} controller cannot be null.`);
  }

  public getController<TController>(): TController {
    return Assert.notNull(this.controller as TController | null, `${this.constructor.name} controller is not bound.`);
  }

  protected trackDisposable(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  public refresh(): void {
    this.render();
  }
}