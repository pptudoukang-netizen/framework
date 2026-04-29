import { Component, Node, Prefab } from 'cc';
import { FrameworkError } from '../error/FrameworkError';
import type { Logger } from '../logger/Logger';
import { PrefabFactory } from '../resource/PrefabFactory';
import type { ResourceHandle } from '../resource/ResourceHandle';
import { ResourceManager } from '../resource/ResourceManager';
import { UIHandle } from './UIHandle';
import type { UIConfig } from './UIConfig';
import type { UILayer } from './UILayer';
import { UIRoot } from './UIRoot';
import { UIView } from './UIView';

interface OpenUIEntry {
  readonly config: UIConfig;
  readonly node: Node;
  readonly view: UIView<unknown>;
  readonly prefabHandle: ResourceHandle<Prefab>;
}

export class UIManager {
  private readonly logger: Logger;
  private readonly resourceManager: ResourceManager;
  private readonly uiRoot: UIRoot;
  private readonly prefabFactory: PrefabFactory;

  private readonly configs = new Map<string, UIConfig>();
  private readonly opened = new Map<string, OpenUIEntry>();
  private readonly cachedPrefabs = new Map<string, ResourceHandle<Prefab>>();

  public constructor(
    logger: Logger,
    resourceManager: ResourceManager,
    uiRoot: UIRoot,
    prefabFactory: PrefabFactory = new PrefabFactory(),
  ) {
    this.logger = logger;
    this.resourceManager = resourceManager;
    this.uiRoot = uiRoot;
    this.prefabFactory = prefabFactory;
  }

  public registerConfigs(configs: readonly UIConfig[]): void {
    for (const config of configs) {
      if (this.configs.has(config.id)) {
        throw new FrameworkError({
          module: 'UIManager',
          code: 'DUPLICATE_UI_ID',
          message: `Duplicate UI config id: '${config.id}'.`,
        });
      }
      this.configs.set(config.id, config);
    }
  }

  public async open<TParams, TResult = void>(uiId: string, params: TParams): Promise<UIHandle<TResult>> {
    const config = this.configs.get(uiId);
    if (!config) {
      throw new FrameworkError({
        module: 'UIManager',
        code: 'UI_NOT_REGISTERED',
        message: `UI config not found for id '${uiId}'.`,
      });
    }

    if (this.opened.has(uiId)) {
      throw new FrameworkError({
        module: 'UIManager',
        code: 'UI_ALREADY_OPEN',
        message: `UI '${uiId}' is already open.`,
      });
    }

    const prefabHandle = await this.getPrefabHandle(config);
    const node = this.prefabFactory.create(prefabHandle.asset);
    const view = this.getRequiredView(node, uiId);
    view.__internalSetCloseHandler(() => this.close(uiId));

    this.attachToLayer(node, config.layer);
    view.open(params as unknown);

    this.opened.set(uiId, {
      config,
      node,
      view,
      prefabHandle,
    });

    this.logger.info('UIManager', `Opened UI '${uiId}'.`);

    const resultPromise = Promise.resolve(undefined as TResult);
    return new UIHandle<TResult>(uiId, () => this.close(uiId), resultPromise);
  }

  public close(uiId: string): void {
    const entry = this.opened.get(uiId);
    if (!entry) {
      throw new FrameworkError({
        module: 'UIManager',
        code: 'UI_NOT_OPEN',
        message: `Cannot close UI '${uiId}' because it is not open.`,
      });
    }

    this.opened.delete(uiId);
    entry.node.destroy();

    if (!entry.config.cachePrefab) {
      entry.prefabHandle.dispose();
    }

    this.logger.info('UIManager', `Closed UI '${uiId}'.`);
  }

  public closeAll(layer?: UILayer): void {
    const openIds = [...this.opened.keys()];

    for (const uiId of openIds) {
      if (layer) {
        const entry = this.opened.get(uiId);
        if (!entry || entry.config.layer !== layer) {
          continue;
        }
      }

      this.close(uiId);
    }
  }

  public isOpen(uiId: string): boolean {
    return this.opened.has(uiId);
  }

  public dispose(): void {
    this.closeAll();

    for (const handle of this.cachedPrefabs.values()) {
      if (!handle.isReleased()) {
        handle.dispose();
      }
    }

    this.cachedPrefabs.clear();
    this.configs.clear();
  }

  private async getPrefabHandle(config: UIConfig): Promise<ResourceHandle<Prefab>> {
    if (config.cachePrefab) {
      const cached = this.cachedPrefabs.get(config.id);
      if (cached) {
        return cached;
      }
    }

    const handle = await this.resourceManager.loadPrefab(config.bundle, config.prefabPath);
    if (config.cachePrefab) {
      this.cachedPrefabs.set(config.id, handle);
    }
    return handle;
  }

  private attachToLayer(node: Node, layer: UILayer): void {
    const layerRoot = this.uiRoot.getLayerNode(layer);
    layerRoot.addChild(node);
  }

  private getRequiredView(node: Node, uiId: string): UIView<unknown> {
    const components = node.getComponents(Component);
    const view = components.find((component) => component instanceof UIView);

    if (!view) {
      throw new FrameworkError({
        module: 'UIManager',
        code: 'VIEW_COMPONENT_MISSING',
        message: `UI prefab '${uiId}' root must include a UIView-derived component.`,
      });
    }

    return view as UIView<unknown>;
  }
}