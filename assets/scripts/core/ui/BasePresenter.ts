import { Assert } from '../error/Assert';

export abstract class BasePresenter<TView> {
  protected view: TView | null = null;

  public attach(view: TView): void {
    this.view = Assert.notNull(view, 'Presenter attach view cannot be null.');
    this.refresh();
  }

  public detach(): void {
    this.view = null;
  }

  public abstract refresh(): void;

  protected getView(): TView {
    return Assert.notNull(this.view, 'Presenter is not attached to a view.');
  }
}