import { FrameworkError } from '../error/FrameworkError';
import type { SubGameModule } from './SubGameTypes';

export class SubGameRegistry {
  private readonly modules = new Map<string, SubGameModule>();

  public register(module: SubGameModule): void {
    if (this.modules.has(module.gameId)) {
      throw new FrameworkError({
        module: 'SubGameRegistry',
        code: 'DUPLICATE_SUB_GAME',
        message: `Duplicate subgame id '${module.gameId}'.`,
      });
    }

    this.modules.set(module.gameId, module);
  }

  public get(gameId: string): SubGameModule {
    const module = this.modules.get(gameId);
    if (!module) {
      throw new FrameworkError({
        module: 'SubGameRegistry',
        code: 'SUB_GAME_NOT_FOUND',
        message: `Subgame '${gameId}' is not registered.`,
      });
    }

    return module;
  }

  public has(gameId: string): boolean {
    return this.modules.has(gameId);
  }

  public getAll(): readonly SubGameModule[] {
    return [...this.modules.values()];
  }

  public dispose(): void {
    this.modules.clear();
  }
}
