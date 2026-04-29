import { Assert } from '../error/Assert';

export abstract class BaseController<TView> {
  protected view: TView | null = null;

  public bindView(view: TView): void {
    this.view = Assert.notNull(view, 'Controller bindView requires non-null view.');
    this.onViewBound();
  }

  public unbindView(): void {
    this.onViewUnbound();
    this.view = null;
  }

  public dispose(): void {
    this.unbindView();
  }

  protected onViewBound(): void {
    return;
  }

  protected onViewUnbound(): void {
    return;
  }

  protected getView(): TView {
    return Assert.notNull(this.view, 'Controller view is not bound.');
  }
}