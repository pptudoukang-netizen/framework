# 系统设计文档索引

本目录按系统拆分框架设计，主入口见 [主框架设计总览](../FRAMEWORK_OVERVIEW.md)。

| 顺序 | 文档 | 系统 |
| --- | --- | --- |
| 01 | [01_BOOTSTRAP_LIFECYCLE.md](01_BOOTSTRAP_LIFECYCLE.md) | 启动与生命周期 |
| 02 | [02_ERROR_LOGGING.md](02_ERROR_LOGGING.md) | 错误与日志 |
| 03 | [03_EVENT_BUS.md](03_EVENT_BUS.md) | 事件系统 |
| 04 | [04_FSM.md](04_FSM.md) | FSM 状态机 |
| 05 | [05_MODULE_SYSTEM.md](05_MODULE_SYSTEM.md) | 模块系统 |
| 06 | [06_UI_SYSTEM.md](06_UI_SYSTEM.md) | UI 系统 |
| 07 | [07_RESOURCE_SYSTEM.md](07_RESOURCE_SYSTEM.md) | 资源系统 |
| 08 | [08_CONFIG_SYSTEM.md](08_CONFIG_SYSTEM.md) | 配置系统 |
| 09 | [09_STORAGE_SYSTEM.md](09_STORAGE_SYSTEM.md) | 存档系统 |
| 10 | [10_PLATFORM_SYSTEM.md](10_PLATFORM_SYSTEM.md) | 平台适配系统 |
| 11 | [11_AUDIO_TIMER_SYSTEM.md](11_AUDIO_TIMER_SYSTEM.md) | 音频与计时器 |
| 12 | [12_BUSINESS_SYSTEMS.md](12_BUSINESS_SYSTEMS.md) | 业务系统 |
| 13 | [13_HOT_UPDATE_SYSTEM.md](13_HOT_UPDATE_SYSTEM.md) | 热更新系统 |
| 14 | [14_NETWORK_SYSTEM.md](14_NETWORK_SYSTEM.md) | 网络层系统 |
| 15 | [15_HALL_SUBGAME_SYSTEM.md](15_HALL_SUBGAME_SYSTEM.md) | 大厅与子游戏系统 |
| 16 | [16_UI_PREFAB_BINDING.md](16_UI_PREFAB_BINDING.md) | UI Prefab 制作与绑定生成 |

阅读建议：

1. 先读 `FRAMEWORK_OVERVIEW.md`，理解整体架构、目录结构和系统依赖。
2. 实现 P0 时读 01、02、03、04。
3. 实现 P1 时读 06、07、08、16，并给资源系统预留版本接口。
4. 实现 P2 时读 09、10、11、13、14。
5. 实现 P3 时读 05、12。
6. 实现大厅 + 多子游戏模式时读 04、05、07、08、12、15。
