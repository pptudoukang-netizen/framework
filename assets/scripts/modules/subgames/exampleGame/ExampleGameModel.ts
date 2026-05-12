import { BaseModel } from '../../../core/module/BaseModel';

export class ExampleGameModel extends BaseModel {
  private running = false;
  private runId: string | null = null;

  public start(runId: string): void {
    this.running = true;
    this.runId = runId;
    this.markChanged();
  }

  public stop(): void {
    this.running = false;
    this.runId = null;
    this.markChanged();
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getRunId(): string | null {
    return this.runId;
  }
}
