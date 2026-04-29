import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';

export class RedDotService extends BaseService {
  private readonly states = new Map<string, boolean>();

  public constructor(context: AppContext) {
    super(context);
  }

  public setState(nodeKey: string, active: boolean): void {
    this.states.set(nodeKey, active);
  }

  public isActive(nodeKey: string): boolean {
    return this.states.get(nodeKey) ?? false;
  }
}