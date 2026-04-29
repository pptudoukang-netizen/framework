import type { EventBus } from '../event/EventBus';
import type { AppEventMap } from '../event/AppEventMap';
import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';
import type { IState } from './IState';
import type { StateTransitionTable } from './StateTransitionTable';

interface PendingTransition<TStateId extends string> {
  nextStateId: TStateId;
  params?: unknown;
}

export interface StateMachineOptions<TStateId extends string> {
  module: string;
  logger: Logger;
  eventBus?: EventBus<AppEventMap>;
  transitionTable?: StateTransitionTable<TStateId>;
}

export class StateMachine<TStateId extends string> {
  private readonly module: string;
  private readonly logger: Logger;
  private readonly eventBus?: EventBus<AppEventMap>;
  private readonly transitionTable?: StateTransitionTable<TStateId>;
  private readonly states = new Map<TStateId, IState<TStateId>>();

  private currentStateId: TStateId | null = null;
  private switching = false;
  private pendingTransition: PendingTransition<TStateId> | null = null;

  public constructor(options: StateMachineOptions<TStateId>) {
    this.module = options.module;
    this.logger = options.logger;
    this.eventBus = options.eventBus;
    this.transitionTable = options.transitionTable;
  }

  public register(state: IState<TStateId>): void {
    if (this.states.has(state.id)) {
      throw new FrameworkError({
        module: this.module,
        code: 'DUPLICATE_STATE',
        message: `State '${state.id}' is already registered.`,
      });
    }

    this.states.set(state.id, state);
  }

  public async start(initialState: TStateId, params?: unknown): Promise<void> {
    if (this.currentStateId !== null) {
      throw new FrameworkError({
        module: this.module,
        code: 'ALREADY_STARTED',
        message: 'State machine is already started.',
      });
    }

    await this.changeTo(initialState, params);
  }

  public async changeTo(nextStateId: TStateId, params?: unknown): Promise<void> {
    const nextState = this.states.get(nextStateId);
    if (!nextState) {
      throw new FrameworkError({
        module: this.module,
        code: 'STATE_NOT_REGISTERED',
        message: `State '${nextStateId}' is not registered.`,
      });
    }

    if (this.switching) {
      if (this.pendingTransition !== null) {
        throw new FrameworkError({
          module: this.module,
          code: 'TRANSITION_CONFLICT',
          message: `State transition conflict. Pending '${this.pendingTransition.nextStateId}', rejected '${nextStateId}'.`,
        });
      }

      this.pendingTransition = {
        nextStateId,
        params,
      };
      return;
    }

    const previousStateId = this.currentStateId;

    if (previousStateId === nextStateId) {
      throw new FrameworkError({
        module: this.module,
        code: 'NOOP_TRANSITION',
        message: `State is already '${nextStateId}'.`,
      });
    }

    this.transitionTable?.assertCanTransit(previousStateId, nextStateId);

    this.switching = true;

    try {
      if (previousStateId !== null) {
        const previousState = this.states.get(previousStateId);
        if (!previousState) {
          throw new FrameworkError({
            module: this.module,
            code: 'CURRENT_STATE_MISSING',
            message: `Current state '${previousStateId}' is missing.`,
          });
        }

        await previousState.exit();
      }

      this.currentStateId = nextStateId;
      await nextState.enter(params);

      this.logger.info(this.module, `State changed: ${String(previousStateId)} -> ${String(nextStateId)}`);
      this.eventBus?.emit('StateChanged', {
        from: previousStateId,
        to: nextStateId,
      });
    } catch (error) {
      this.currentStateId = previousStateId;
      throw FrameworkError.fromUnknown(
        this.module,
        'STATE_CHANGE_FAILED',
        `Failed to change to state '${nextStateId}'.`,
        error,
        {
          from: previousStateId,
          to: nextStateId,
        },
      );
    } finally {
      this.switching = false;
    }

    const queued = this.pendingTransition;
    if (queued !== null) {
      this.pendingTransition = null;
      await this.changeTo(queued.nextStateId, queued.params);
    }
  }

  public update(deltaTime: number): void {
    if (this.currentStateId === null) {
      return;
    }

    const currentState = this.states.get(this.currentStateId);
    if (!currentState) {
      throw new FrameworkError({
        module: this.module,
        code: 'CURRENT_STATE_MISSING',
        message: `Current state '${this.currentStateId}' is missing during update.`,
      });
    }

    currentState.update?.(deltaTime);
  }

  public getCurrentStateId(): TStateId | null {
    return this.currentStateId;
  }
}