
# 通用cocoscreator3.8.8 ts基础框架设计模板

## 1. 框架目标

本框架用于支撑中大型项目的长期维护与扩展。

核心目标：

- 模块边界清晰
- 依赖方向稳定
- 业务逻辑可测试
- 问题可快速定位
- 新功能可低成本扩展
- 禁止通过兜底代码掩盖问题

---

## 2. 总体架构

推荐采用分层 + 模块化架构：

project/
├─ core/              # 基础框架能力
├─ modules/           # 业务模块
├─ configs/           # 配置与数据定义
├─ platform/          # 平台 / SDK / 外部系统适配
├─ common/            # 通用纯工具
└─ main.ts            # 项目入口
3. 分层职责
Presentation / UI 层
- 负责展示
- 负责用户输入
- 不写核心业务

Application / Service 层
- 负责用例编排
- 负责业务流程调度
- 不依赖具体 UI

Domain / Model 层
- 负责核心业务规则
- 负责状态流转
- 不依赖框架、SDK、数据库

Infrastructure / Adapter 层
- 负责资源、存储、网络、SDK
- 通过接口暴露能力
4. core 基础框架
core/
├─ app/           # 应用启动、生命周期
├─ event/         # 事件总线
├─ fsm/           # 状态机
├─ ui/            # UI 管理
├─ resource/      # 资源加载
├─ storage/       # 本地存储
├─ audio/         # 音频
├─ timer/         # 时间管理
├─ error/         # 断言与错误
└─ logger/        # 日志
core 规则
core 只提供基础能力
core 不依赖业务模块
core 不写具体业务逻辑
core 接口必须稳定
core 允许被 modules 调用
modules 不允许反向污染 core
5. modules 业务模块

推荐结构：

modules/example/
├─ ExampleModel.ts
├─ ExampleService.ts
├─ ExampleController.ts
├─ ExampleView.ts
├─ ExampleTypes.ts
├─ ExampleEvents.ts
└─ index.ts
模块职责
Model：
- 保存模块数据
- 提供状态查询
- 不操作 UI

Service：
- 执行业务规则
- 修改 Model
- 派发事件
- 不依赖具体 View

Controller：
- 接收用户操作
- 调用 Service
- 控制界面刷新

View：
- 绑定节点
- 刷新显示
- 播放动画
- 不写业务规则
6. 依赖方向
View
 ↓
Controller
 ↓
Service
 ↓
Model / Domain

Service
 ↓
Adapter Interface
 ↓
Adapter Implementation

禁止：

Model 调用 View
Service 直接操作 UI 节点
Domain 依赖 SDK
core 依赖 modules
模块之间互相直接改数据
7. 事件系统

事件总线只用于跨模块通知。

适合：

数据变化通知
状态变化通知
系统级事件
UI 刷新通知

不适合：

承载完整业务流程
替代正常函数调用
隐式修改其他模块数据

事件命名：

export enum AppEvent {
  UserChanged = 'UserChanged',
  ConfigLoaded = 'ConfigLoaded',
  ResourceLoaded = 'ResourceLoaded',
}
8. 状态机

状态机用于管理流程：

InitState
↓
LoadState
↓
LoginState
↓
MainState
↓
RunningState
↓
ResultState

规则：

状态只负责流程切换
复杂业务交给 Service
状态切换失败必须抛错
禁止状态之间互相调用内部方法
9. 配置系统
configs/
├─ ConfigService.ts
├─ ItemConfig.ts
├─ LevelConfig.ts
└─ RewardConfig.ts

规则：

配置加载后必须统一校验
ID 重复直接报错
字段缺失直接报错
类型错误直接报错
引用不存在直接报错
不允许自动补默认值
10. 资源系统

ResourceManager 职责：

统一加载资源
统一释放资源
管理缓存
管理引用
支持预加载

规则：

禁止业务代码散落直接加载资源
缺资源必须报错
加载失败必须暴露原因
不允许默认资源兜底
11. 存储系统

StorageService 职责：

读取数据
写入数据
校验结构
处理版本迁移

规则：

存档结构错误直接报错
版本不匹配必须走迁移逻辑
不允许静默重置数据
不允许读取失败后返回空对象
12. 平台适配层

业务代码禁止直接依赖第三方 SDK。

推荐：

interface PlatformAdapter {
  login(): Promise<LoginResult>
  pay(orderId: string): Promise<void>
  share(params: ShareParams): Promise<void>
}

实现：

platform/
├─ PlatformAdapter.ts
├─ WebAdapter.ts
├─ AndroidAdapter.ts
├─ IOSAdapter.ts
└─ WechatAdapter.ts
13. 错误处理规范

统一使用 fail-fast 原则。

禁止：

try {
  ...
} catch (e) {
  return []
}

推荐：

if (!config) {
  throw new Error('[ConfigService] Missing config: item_config')
}

错误信息必须包含：

模块名
失败原因
关键参数
当前状态
14. 可读性规范
函数只做一件事
变量名表达业务含义
复杂条件拆成具名变量
魔法数字提取为常量
避免超过 3 层嵌套
注释解释原因，不解释表面代码
禁止无关重构
15. 健壮性规范

健壮性必须来自：

输入校验
类型约束
状态断言
配置校验
自动化测试
明确错误抛出

禁止通过以下方式制造“假健壮”：

fallback
默认值兜底
silent return
吞异常
mock 数据兜底
自动修复未知数据
16. 测试规范

推荐测试重点：

Service 业务逻辑
Config 校验
状态机切换
存储迁移
Adapter 接口行为

测试原则：

核心业务必须可单测
UI 展示不承载核心逻辑
外部 SDK 使用 mock adapter
配置错误必须有测试覆盖
17. 禁止设计

禁止：

超级 Manager
万能 Utils
所有逻辑写进 UI
模块互相直接读写数据
业务代码直接调用 SDK
业务代码直接散落加载资源
EventBus 承载业务流程
为了省事破坏架构边界
18. 推荐开发流程
1. 定义模块边界
2. 定义数据结构
3. 定义接口协议
4. 定义配置表
5. 实现 Model
6. 实现 Service
7. 接入 Controller
8. 接入 View
9. 补充测试
10. 做集成验证

## 3. UI 框架设计

UI 基类
export abstract class BaseView extends Component {
  protected abstract bindNodes(): void
  protected abstract bindEvents(): void
  protected abstract render(): void

  onLoad() {
    this.bindNodes()
    this.bindEvents()
  }

  show() {
    this.node.active = true
    this.render()
  }

  hide() {
    this.node.active = false
  }
}
UI 管理器职责
UIManager 只负责：
- 打开界面
- 关闭界面
- 层级管理
- prefab 加载
- 界面缓存

禁止：

UIManager 不处理背包、商城、关卡、任务等业务逻辑


## 4. 游戏流程 FSM

推荐用状态机管理主流程。

BootState
↓
LoadConfigState
↓
LoginState
↓
HallState
↓
SubGameLoadingState
↓
SubGameRunningState
↓
SubGameSettlementState
↓
HallState
状态职责
BootState：
初始化框架

LoadConfigState：
加载配置并校验

LoginState：
登录、存档读取

HallState：
大厅界面、玩家信息、子游戏入口

SubGameLoadingState：
校验 gameId，加载子游戏配置、UI 和玩法资源

SubGameRunningState：
创建并运行当前子游戏，接收退出结果

SubGameSettlementState：
编排结算、奖励、任务进度，回到大厅
状态机规则
- 状态只负责流程切换
- 状态内部不要写复杂业务
- 业务逻辑交给对应模块 Service
- 状态切换失败必须抛错
- 禁止状态之间互相直接调用内部方法


## 5. 事件总线设计

事件总线只用于 跨模块通知。

推荐事件
export enum GameEvent {
  CoinChanged = 'CoinChanged',
  ItemChanged = 'ItemChanged',
  LevelCompleted = 'LevelCompleted',
  ShopBuySuccess = 'ShopBuySuccess',
  GuideStepChanged = 'GuideStepChanged',
}
使用边界

适合：

金币变化通知 UI 刷新
背包变化通知红点系统
关卡完成通知任务系统
购买成功通知统计系统

不适合：

用 EventBus 串完整业务流程
用 EventBus 替代函数调用
用 EventBus 隐式修改其他模块数据

## 6. 数据驱动设计

休闲手游强烈建议配置驱动。

常见配置
level_config.json
item_config.json
shop_config.json
task_config.json
guide_config.json
reward_config.json
audio_config.json
配置加载流程
加载配置
↓
解析配置
↓
校验字段
↓
注册到 ConfigService
↓
业务模块读取
配置规则
- 配置缺字段直接报错
- ID 重复直接报错
- 引用不存在直接报错
- 类型错误直接报错
- 不允许自动补默认值

## 7. 资源管理设计
资源类型
Prefab
SpriteFrame
AudioClip
Spine
JsonAsset
Font
Material
ResourceManager 职责
- 统一加载资源
- 统一释放资源
- 记录引用关系
- 支持 bundle
- 支持预加载
推荐规则
- UI prefab 由 UIManager 加载
- 音频资源由 AudioManager 加载
- 玩法资源由 SubGameResourceScope 或子游戏资源服务加载
- 禁止业务模块随意 cc.resources.load
- 缺资源必须报错

## 8. 存档系统设计
SaveData 推荐结构
export interface SaveData {
  version: number
  player: PlayerSaveData
  bag: BagSaveData
  level: LevelSaveData
  shop: ShopSaveData
  task: TaskSaveData
}
StorageService 职责
- 读取存档
- 写入存档
- 校验存档版本
- 处理版本迁移
规则
- 存档结构不合法直接报错
- 版本不匹配必须走迁移逻辑
- 不允许默默重置用户存档
- 不允许读取失败后返回空存档，除非是明确的新用户流程

## 9. 平台适配层

不要在业务代码中直接写平台 SDK。

坏例子：

wx.showRewardedVideoAd()

好例子：

interface PlatformAdapter {
  showRewardAd(adId: string): Promise<void>
  login(): Promise<LoginResult>
  vibrate(): void
}
platform/
├─ PlatformAdapter.ts
├─ WechatAdapter.ts
├─ AndroidAdapter.ts
├─ IOSAdapter.ts
└─ WebAdapter.ts

业务只依赖接口：

await platform.showRewardAd('revive_ad')

## 10.红点系统设计
RedDotService
├─ 注册红点节点
├─ 监听数据事件
├─ 计算红点状态
└─ 通知 UI 刷新

规则：

- 红点只计算状态
- 不修改业务数据
- 不主动拉取 UI
- 数据变化由事件驱动

## 11.广告系统设计
AdService
├─ 激励视频
├─ 插屏广告
├─ Banner
└─ 广告冷却

业务调用：

await AdService.showRewardAd(AdPlacement.Revive)
RewardService.grantRevive()

规则：

- 看广告和发奖励必须分离
- 广告成功后才发奖励
- 广告失败必须暴露原因
- 不允许广告失败后默认发奖励

## 12.音频系统设计
AudioManager
├─ playBgm
├─ stopBgm
├─ playSfx
├─ setBgmVolume
├─ setSfxVolume
└─ mute

规则：

- 音频 key 必须来自配置
- 缺音频资源直接报错
- 不允许播放失败静默忽略
十五、新手引导系统设计
GuideService
├─ 当前步骤
├─ 条件判断
├─ 遮罩显示
├─ 点击拦截
├─ 步骤推进
└─ 存档记录

配置示例：

{
  "id": 101,
  "target": "Home/StartButton",
  "type": "click",
  "next": 102
}
