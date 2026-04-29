import type { AppContext } from '../app/AppContext';

export abstract class BaseService {
  protected readonly context: AppContext;

  protected constructor(context: AppContext) {
    this.context = context;
  }

  public dispose?(): void {
    return;
  }
}