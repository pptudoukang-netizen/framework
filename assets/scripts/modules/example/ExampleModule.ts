import { BaseModule } from '../../core/module/BaseModule';
import type { AppContext } from '../../core/app/AppContext';
import { ExampleController } from './ExampleController';
import { ExampleModel } from './ExampleModel';
import { ExampleService } from './ExampleService';

export class ExampleModule extends BaseModule {
  public readonly name = 'ExampleModule';

  private model!: ExampleModel;
  private service!: ExampleService;
  private controller!: ExampleController;

  public override init(context: AppContext): void {
    super.init(context);
    this.model = new ExampleModel();
    this.service = new ExampleService(context, this.model);
    this.controller = new ExampleController(this.service);
  }

  public getController(): ExampleController {
    return this.controller;
  }

  public getService(): ExampleService {
    return this.service;
  }
}