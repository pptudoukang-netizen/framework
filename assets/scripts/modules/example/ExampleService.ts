import { CoreTokens } from '../../core/app/CoreTokens';
import type { AppContext } from '../../core/app/AppContext';
import type { EventBus } from '../../core/event/EventBus';
import { BaseService } from '../../core/module/BaseService';
import { ExampleModel } from './ExampleModel';

interface ExampleEventMap {
  ExampleCountChanged: { count: number };
}

export class ExampleService extends BaseService {
  private readonly model: ExampleModel;
  private readonly eventBus: EventBus<ExampleEventMap>;

  public constructor(context: AppContext, model: ExampleModel) {
    super(context);
    this.model = model;
    this.eventBus = context.get(CoreTokens.EventBus) as unknown as EventBus<ExampleEventMap>;
  }

  public getCount(): number {
    return this.model.getCount();
  }

  public increaseCount(delta: number = 1): void {
    this.model.setCount(this.model.getCount() + delta);
    this.eventBus.emit('ExampleCountChanged', {
      count: this.model.getCount(),
    });
  }
}