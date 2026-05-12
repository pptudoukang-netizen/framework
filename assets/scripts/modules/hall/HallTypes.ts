import type { SubGameEnterParams } from '../../core/gameplay/SubGameTypes';

export interface HallSubGameEntry {
  readonly gameId: string;
  readonly displayName: string;
}

export interface HallEnterSubGameRequest extends SubGameEnterParams {}

export interface HallViewContract {
  renderEntries(entries: readonly HallSubGameEntry[]): void;
}
