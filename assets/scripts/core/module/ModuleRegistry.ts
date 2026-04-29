import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';
import type { AppContext } from '../app/AppContext';
import type { IModule } from './IModule';

export class ModuleRegistry {
  private readonly logger: Logger;
  private readonly modules = new Map<string, IModule>();

  public constructor(logger: Logger) {
    this.logger = logger;
  }

  public register(module: IModule): void {
    if (this.modules.has(module.name)) {
      throw new FrameworkError({
        module: 'ModuleRegistry',
        code: 'DUPLICATE_MODULE',
        message: `Duplicate module name '${module.name}'.`,
      });
    }

    this.modules.set(module.name, module);
  }

  public async initAll(context: AppContext): Promise<void> {
    for (const module of this.modules.values()) {
      await module.init(context);
      this.logger.info('ModuleRegistry', `Module initialized: ${module.name}`);
    }
  }

  public async startAll(): Promise<void> {
    for (const module of this.modules.values()) {
      if (module.start) {
        await module.start();
      }
      this.logger.info('ModuleRegistry', `Module started: ${module.name}`);
    }
  }

  public get<TModule extends IModule>(name: string): TModule {
    const module = this.modules.get(name);
    if (!module) {
      throw new FrameworkError({
        module: 'ModuleRegistry',
        code: 'MODULE_NOT_FOUND',
        message: `Module '${name}' not found.`,
      });
    }

    return module as TModule;
  }

  public dispose(): void {
    for (const module of this.modules.values()) {
      module.dispose();
    }

    this.modules.clear();
  }
}