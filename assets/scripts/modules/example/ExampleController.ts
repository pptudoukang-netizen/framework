import { BaseController } from '../../core/module/BaseController';
import type { ExampleViewContract } from './ExampleTypes';
import { ExampleService } from './ExampleService';

export class ExampleController extends BaseController<ExampleViewContract> {
  private readonly service: ExampleService;

  public constructor(service: ExampleService) {
    super();
    this.service = service;
  }

  protected override onViewBound(): void {
    this.refresh();
  }

  public onTapAdd(): void {
    this.service.increaseCount(1);
    this.refresh();
  }

  public refresh(): void {
    this.getView().renderCount(this.service.getCount());
  }
}