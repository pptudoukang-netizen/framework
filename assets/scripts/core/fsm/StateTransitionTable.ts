import { FrameworkError } from '../error/FrameworkError';

export class StateTransitionTable<TStateId extends string> {
  private readonly transitions = new Map<TStateId, Set<TStateId>>();

  public allow(from: TStateId, to: TStateId): void {
    let targets = this.transitions.get(from);
    if (!targets) {
      targets = new Set<TStateId>();
      this.transitions.set(from, targets);
    }

    targets.add(to);
  }

  public canTransit(from: TStateId | null, to: TStateId): boolean {
    if (from === null) {
      return true;
    }

    const targets = this.transitions.get(from);
    if (!targets) {
      return false;
    }

    return targets.has(to);
  }

  public assertCanTransit(from: TStateId | null, to: TStateId): void {
    if (this.canTransit(from, to)) {
      return;
    }

    throw new FrameworkError({
      module: 'StateTransitionTable',
      code: 'ILLEGAL_TRANSITION',
      message: `Illegal state transition: ${String(from)} -> ${String(to)}.`,
      details: {
        from,
        to,
      },
    });
  }
}