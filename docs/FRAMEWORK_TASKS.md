# 框架开发任务清单（基于 FRAMEWORK_OVERVIEW）

> 来源：`docs/FRAMEWORK_OVERVIEW.md` 与 `docs/FRAMEWORK_CLASS_ARCHITECTURE.md`
> 执行原则：Fail-Fast、无 fallback、无 mock 兜底、严格分层。

## P0 启动闭环
- [x] 搭建 `ServiceToken` + `AppContext` + `Disposable`
- [x] 搭建 `FrameworkError` + `Assert` + `ErrorReporter` + `Logger`
- [x] 搭建 `EventBus` + `EventSubscription` + `AppEventMap`
- [x] 搭建 `IState/BaseState/StateMachine/StateTransitionTable`
- [x] 搭建 `GameState/GameStateMachine` 与主流程状态
- [x] 搭建 `AppBootstrap` 并驱动 FSM 生命周期

## P1 资源/UI/配置闭环
- [x] 搭建 `ResourceVersionProvider/ResourceKey/ResourceHandle/BundleLoader/PrefabFactory/ResourceManager`
- [x] 搭建 `BaseView/UIView/BasePresenter/UIRoot/UILayer/UIConfig/UIHandle/UIManager/NodeBinder`
- [x] 搭建 `ConfigManifest/ConfigTable/ConfigValidator/ConfigReferenceValidator/BaseConfigRepository/ConfigService`

## P2 基础设施闭环
- [x] 搭建 `SaveData/SaveDataValidator/SaveMigration/SaveMigrationPipeline/SaveRepository/StorageService`
- [x] 搭建 `PlatformTypes/PlatformAdapter/PlatformService/WebPlatformAdapter/WechatPlatformAdapter`
- [x] 搭建 `AudioRoot/AudioConfigRepository/AudioManager`
- [x] 搭建 `TimerHandle/TimerService`
- [x] 搭建 `HotUpdateAdapter/HotUpdateService/HotUpdateManifestService/HotUpdateSearchPathService/NativeHotUpdateAdapter`
- [x] 搭建 `NetworkConfig/NetworkService/HttpClient/WebSocketClient/Protocol/Router/Heartbeat/Reconnect/Auth`

## P3 模块化与业务样板
- [x] 搭建 `IModule/BaseModule/ModuleRegistry/BaseModel/BaseService/BaseController/ModuleFacade`
- [x] 搭建 Example 模块 MVC 样板
- [x] 搭建 `bag/currency/level/reward/ad/task/shop/reddot/guide` 服务骨架

## P4 大厅与多子游戏闭环
- [ ] 在 `Boot.scene` 增加 `GameplayRoot`，并在 `AppBootstrap` 中 fail-fast 绑定
- [ ] 新增 `GameplayRootService` 并注册到 `AppContext`
- [ ] 定义 `SubGameModule/SubGameEnterParams/SubGameExitResult`
- [ ] 实现 `SubGameRegistry`，只负责注册和查找子游戏
- [ ] 实现 `SubGameLifecycleService`，统一编排 preload、enter、exit、dispose
- [ ] 新增 `HallState/SubGameLoadingState/SubGameRunningState/SubGameSettlementState`
- [ ] 更新 `GameStateMachine` 合法转移表
- [ ] 新增 `subgame_config` 类型、validator、repository 和跨表引用校验
- [ ] 新增 `HallModule/HallUI`
- [ ] 接入一个最小 `exampleGame`，跑通大厅进入、运行、退出、结算、返回大厅
- [ ] 验证子游戏退出后节点、事件、timer、资源 owner 全部释放

## 验收
- [x] 统一导出入口并按目录组织
- [x] TypeScript 编译检查通过
- [x] 更新本清单为完成状态
- [ ] 大厅 + 多子游戏文档已同步到总览、FSM、模块、资源、配置和业务系统

