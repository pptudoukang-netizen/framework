# 热更新 Manifest 自动生成

该目录用于生成 Cocos 原生热更新需要的 `project.manifest` 和 `version.manifest`，避免手工维护资源列表、`md5` 和 `size`。

## 使用方式

```bash
npm run hotupdate:manifest
```

只生成指定目标：

```bash
npm run hotupdate:manifest -- --target full
npm run hotupdate:manifest -- --target shell,subgame-exampleGame
```

临时覆盖版本号：

```bash
npm run hotupdate:manifest -- --target subgame-exampleGame --version 1.0.1
```

查看命令说明：

```bash
npm run hotupdate:manifest -- --help
```

## 配置说明

默认读取 `tools/hotupdate/hotupdate.config.json`。

每个 `targets` 项对应一组 manifest：

| 字段 | 说明 |
| --- | --- |
| `name` | 目标名，命令行 `--target` 使用这个名字。 |
| `version` | 当前资源版本，写入两个 manifest。 |
| `sourceDir` | 参与生成 manifest 的构建产物目录。正式生成前必须先完成 Cocos 构建。 |
| `outputDir` | 生成 `project.manifest` 和 `version.manifest` 的目录。 |
| `packageUrl` | 远端资源包根地址，必须以 `/` 结尾。 |
| `remoteVersionUrl` | 远端 `version.manifest` URL。 |
| `remoteManifestUrl` | 远端 `project.manifest` URL。 |
| `searchPaths` | 写入 manifest 的搜索路径，默认空数组。 |
| `include` | 可选。只包含匹配的文件，支持 `*`、`**`、`?`。 |
| `exclude` | 可选。排除匹配的文件，支持 `*`、`**`、`?`。 |

脚本会默认排除 `project.manifest`、`version.manifest`、Cocos `.meta` 和常见系统元文件，防止非业务资源进入清单。

## 当前项目约定

- `full`：全量包。用于 `subGameIndependentUpdateEnabled=false`，启动时更新大厅、公共模块和所有子游戏。
- `shell`：大厅壳包。用于 `subGameIndependentUpdateEnabled=true`，启动时只更新大厅、框架和公共模块。
- `subgame-exampleGame`：示例子游戏包。用于进入 `exampleGame` 前单独更新该子游戏 bundle。

默认输出目录与 `AppBootstrap` / `subgame_config.json` 保持一致：

| 目标 | 输出目录 | 运行时读取路径 |
| --- | --- | --- |
| `full` | `assets/resources/hotupdate` | `hotupdate/project.manifest` |
| `shell` | `assets/resources/hotupdate/shell` | `hotupdate/shell/project.manifest` |
| `subgame-exampleGame` | `assets/resources/subgames/exampleGame` | `subgames/exampleGame/project.manifest` |

## 接入注意

- `sourceDir` 必须按真实 Cocos 构建产物调整。
- `shell.exclude` 必须排除所有子游戏 bundle 对应目录，否则大厅壳包会错误包含子游戏内容。
- 新增子游戏时，需要增加一个 `subgame-<gameId>` target，并让输出目录与该子游戏配置的 `hotUpdate.localManifestPath` 对齐。
- 生成出的远端 manifest 必须与实际上传到 CDN 的资源目录、版本号保持一致。
- 缺少配置、URL 非法、目录不存在或未匹配到任何文件都会直接失败，不做静默兜底。
