import { FrameworkError } from '../../core/error/FrameworkError';
import type { AppContext } from '../../core/app/AppContext';
import { BaseService } from '../../core/module/BaseService';

export class GuideService extends BaseService {
  private currentStep = 0;

  public constructor(context: AppContext) {
    super(context);
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public advance(nextStep: number): void {
    if (nextStep <= this.currentStep) {
      throw new FrameworkError({
        module: 'GuideService',
        code: 'GUIDE_STEP_INVALID',
        message: `Guide step must advance. current=${this.currentStep} next=${nextStep}`,
      });
    }

    this.currentStep = nextStep;
  }
}