# UI Prefab 制作与绑定生成规范

## 1. 系统定位

UI prefab 绑定生成用于把 prefab 中符合命名规范的节点转换成 TypeScript 绑定基类。它只解决节点和组件引用，不生成业务逻辑，不替代 `UIManager`，也不改变 View / Controller / Service 的职责边界。

生成结果属于开发期产物，运行时仍通过 `NodeBinder` 做 fail-fast 校验：

- 缺节点直接报错。
- 缺组件直接报错。
- 节点命名不合法直接生成失败。
- 生成文件过期时 `ui:check` 直接失败。

## 2. 目录规范

UI prefab 必须按模块存放：

```text
assets/prefabs/ui/
├─ hall/
│  └─ HallView.prefab
├─ shop/
│  └─ ShopView.prefab
└─ subgames/
   └─ exampleGame/
      └─ ExampleGameView.prefab
```

生成脚本按 prefab 相对路径输出绑定基类：

```text
assets/scripts/modules/
├─ hall/
│  └─ generated/
│     └─ HallViewBinding.generated.ts
├─ shop/
│  └─ generated/
│     └─ ShopViewBinding.generated.ts
└─ subgames/
   └─ exampleGame/
      └─ generated/
         └─ ExampleGameViewBinding.generated.ts
```

根节点命名必须和 prefab 文件名一致。例如 `ShopView.prefab` 的根节点必须叫 `ShopView`。

## 3. 节点命名规范

只有命中绑定前缀的节点会被生成，普通布局节点可以继续使用业务可读名称。绑定节点命名格式：

```text
<prefix><MeaningName>
```

示例：

```text
ShopView
└─ nodeContentRoot
   ├─ lblTitle
   ├─ scrollGoodsList
   │  └─ nodeGoodsContent
   ├─ btnBuy
   └─ btnClose
```

默认前缀：

| 前缀 | 必需组件 | 生成字段示例 |
| --- | --- | --- |
| `node` | `Node` | `nodeContentRoot` -> `contentRootNode` |
| `btn` | `Button` | `btnClose` -> `closeButton` |
| `lbl` | `Label` | `lblTitle` -> `titleLabel` |
| `rich` | `RichText` | `richDesc` -> `descRichText` |
| `spr` | `Sprite` | `sprIcon` -> `iconSprite` |
| `toggle` | `Toggle` | `toggleMusic` -> `musicToggle` |
| `edit` | `EditBox` | `editName` -> `nameEditBox` |
| `scroll` | `ScrollView` | `scrollGoodsList` -> `goodsListScrollView` |
| `progress` | `ProgressBar` | `progressExp` -> `expProgressBar` |
| `slider` | `Slider` | `sliderVolume` -> `volumeSlider` |
| `layout` | `Layout` | `layoutItems` -> `itemsLayout` |
| `page` | `PageView` | `pageBanner` -> `bannerPageView` |
| `mask` | `Mask` | `maskAvatar` -> `avatarMask` |
| `graphics` | `Graphics` | `graphicsGuide` -> `guideGraphics` |
| `anim` | `Animation` | `animOpen` -> `openAnimation` |
| `widget` | `Widget` | `widgetSafeArea` -> `safeAreaWidget` |

## 4. 禁止命名

以下命名会导致生成失败：

- 只有前缀没有语义，例如 `btn`、`lbl`。
- 同一个父节点下有重名子节点。
- 同一个 prefab 内生成出重复字段。
- 节点名包含 `/`。
- 绑定前缀要求组件，但节点上没有对应组件。
- prefab 根节点名和 prefab 文件名不一致。

## 5. 生成代码用法

生成命令：

```bash
npm run ui:generate
```

CI 校验命令：

```bash
npm run ui:check
```

手写 View 继承生成基类：

```ts
import { _decorator, Button } from 'cc';
import { ShopViewBinding } from './generated/ShopViewBinding.generated';
import { ShopController } from './ShopController';
import type { ShopViewContract } from './ShopTypes';

const { ccclass } = _decorator;

@ccclass('ShopView')
export class ShopView extends ShopViewBinding implements ShopViewContract {
  protected bindEvents(): void {
    this.buyButton.node.on(Button.EventType.CLICK, this.onBuyClick, this);
    this.closeButton.node.on(Button.EventType.CLICK, this.close, this);
  }

  protected render(): void {
    return;
  }

  protected onOpen(): void {
    this.getController<ShopController>().refresh();
  }

  private onBuyClick(): void {
    this.getController<ShopController>().buySelectedGoods();
  }
}
```

## 6. 分层边界

- 生成基类只保存节点和组件引用。
- View 只负责显示、输入转发、动画。
- Controller 只负责交互调度。
- Service 负责业务逻辑。
- UI prefab 仍必须通过 `UIManager` 打开。
- 业务资源仍必须通过 `ResourceManager` 加载。

禁止把存档、平台 SDK、网络请求、业务规则放进生成脚本或 View 脚本。

## 7. 工具配置

配置文件位于：

```text
tools/ui-binding/ui-binding.config.json
```

如需扩展前缀，必须在配置中明确声明类型和字段后缀。扩展前缀后，必须执行 `npm run ui:generate` 并提交生成结果。
