import type { TimerHandle } from '../../timer/TimerHandle';
import { TimerService } from '../../timer/TimerService';
import type { HeartbeatConfig } from '../NetworkConfig';

export class HeartbeatService {
  private readonly timerService: TimerService;
  private readonly config: HeartbeatConfig;
  private heartbeatHandle: TimerHandle | null = null;

  public constructor(timerService: TimerService, config: HeartbeatConfig) {
    this.timerService = timerService;
    this.config = config;
  }

  public start(sendHeartbeat: () => void): void {
    this.stop();
    this.heartbeatHandle = this.timerService.scheduleInterval(this.config.intervalMs / 1000, sendHeartbeat);
  }

  public stop(): void {
    if (this.heartbeatHandle) {
      this.heartbeatHandle.dispose();
      this.heartbeatHandle = null;
    }
  }
}