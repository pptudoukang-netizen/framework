import { BaseController } from '../../core/module/BaseController';
import { HallService } from './HallService';
import type { HallEnterSubGameRequest, HallViewContract } from './HallTypes';

export class HallController extends BaseController<HallViewContract> {
  private readonly service: HallService;

  public constructor(service: HallService) {
    super();
    this.service = service;
  }

  protected override onViewBound(): void {
    this.refresh();
  }

  public refresh(): void {
    this.getView().renderEntries(this.service.refreshEntries());
  }

  public async onSelectSubGame(request: HallEnterSubGameRequest): Promise<void> {
    await this.service.requestEnterSubGame(request);
  }
}
