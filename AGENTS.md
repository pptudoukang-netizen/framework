## Cocos 手游框架规范

### 主框架设计总览
- 优先阅读FRAMEWORK_OVERVIEW.md

### 架构原则

- 项目采用模块化架构
- UI 使用 MVC / MVP 分层
- 主流程使用 FSM 状态机
- 跨模块通知使用 EventBus
- 玩法、道具、关卡、任务、商城使用数据驱动
- 平台 SDK 必须通过 PlatformAdapter 接入

### 禁止行为

- 禁止超级 Manager 类
- 禁止所有业务逻辑写在 UI 脚本里
- 禁止模块之间直接互相修改数据
- 禁止滥用全局单例
- 禁止 EventBus 承载完整业务流程
- 禁止随意 cc.find 查找节点
- 禁止静默失败
- 禁止 fallback 兜底
- 禁止 mock 数据兜底

### Fail-Fast 规则

- 缺节点直接报错
- 缺资源直接报错
- 缺配置直接报错
- 配置字段错误直接报错
- 非法状态直接报错
- SDK 调用失败必须暴露错误

### UI 规则

- View 只负责显示
- Controller 只负责交互调度
- Service 负责业务逻辑
- Model 负责数据状态
- UI 脚本不直接读写存档
- UI 脚本不直接请求平台 SDK

### 资源规则

- 资源必须通过 ResourceManager 加载
- UI prefab 必须通过 UIManager 打开
- 玩法资源必须在关卡退出时释放
- 禁止业务代码散落直接加载资源

### 配置规则

- 配置加载后必须统一校验
- 不允许配置缺失后使用默认值
- 不允许 ID 重复
- 不允许引用不存在的资源或道具
