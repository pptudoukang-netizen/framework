import type { AppContext } from '../../core/app/AppContext';
import { BaseModule } from '../../core/module/BaseModule';
import { HallController } from './HallController';
import { HallModel } from './HallModel';
import { HallService } from './HallService';

export class HallModule extends BaseModule {
  public readonly name = 'HallModule';

  private model!: HallModel;
  private service!: HallService;
  private controller!: HallController;

  public override init(context: AppContext): void {
    super.init(context);
    this.model = new HallModel();
    this.service = new HallService(context, this.model);
    this.controller = new HallController(this.service);
  }

  public getController(): HallController {
    return this.controller;
  }

  public getService(): HallService {
    return this.service;
  }
}
