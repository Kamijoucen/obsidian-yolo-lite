# YOLO-Lite

YOLO-Lite 是一个经过精简的 Obsidian AI 插件，专注于 Agent 对话、Vault 操作、Skills 与联网搜索。

## 项目来源

本项目基于 [lapis0x0/obsidian-yolo](https://github.com/lapis0x0/obsidian-yolo) 裁剪并重构，感谢原作者及贡献者完成的基础工作。YOLO-Lite 现作为独立插件维护，不与原仓库保持同步或兼容关系。

YOLO-Lite 面向更轻量、聚焦的个人使用需求。以下内容不是通过功能开关隐藏，而是从代码、配置、界面、命令入口、样式、资源、测试、构建流程和依赖中直接移除：

- 空格提示（Smart Space）
- Quick Ask
- 选区聊天
- Tab 补全
- PDF 读取、选区与截图支持
- PGlite、RAG、Embedding、向量数据库与语义搜索
- OpenAI 和中国国产模型之外的 LLM 供应商
- 第三方 MCP 客户端、服务器配置、传输层与按需工具披露
- 对外提供 Vault 搜索和 Agent 任务委派的本地 MCP 服务
- 插件自更新、版本检查与更新提示
- 学习项目、AI 大纲与知识点生成、闪卡、FSRS 复习和 Anki 导入
- 面向原版历史配置和旧数据结构的迁移兼容层

内置 Vault、终端和子 Agent 工具作为插件内部能力保留，不通过 MCP 协议接入或对外暴露。本分支不支持连接第三方 MCP，也不作为 MCP 服务被外部 Agent 接入。

## 主要功能

- 侧边栏多会话与后台 Agent
- Agent / Ask 模式
- Vault 文件读写、桌面终端与子 Agent 工具
- 可复用 Skills
- 按目录加载 `AGENTS.md` / `CLAUDE.md` 项目指令
- 可配置的联网搜索
- 图片、Office 文档和文本附件

## 模型供应商

内置支持以下供应商：

- OpenAI API
- ChatGPT OAuth
- 通用 OpenAI 兼容接口
- DeepSeek
- 月之暗面 / Kimi
- 智谱 AI
- 豆包
- SiliconFlow
- 阶跃星辰
- MiniMax
- 腾讯混元
- 小米 MiMo

模型统一通过 OpenAI 兼容的 Chat Completions 或 Responses 协议接入。

## 本地开发

安装依赖并启动监听构建：

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

开发时可将仓库软连接到 Obsidian Vault：

```text
<vault>/.obsidian/plugins/yolo-lite
```

插件目录中必须存在：

- `manifest.json`
- `main.js`
- `styles.css`

随后在 Obsidian 的第三方插件设置中启用 YOLO-Lite。

## 质量检查

```bash
npm run type:check
npm run lint:check
npm test
```

`styles.css` 由 `src/styles/**` 生成。修改样式源码后运行：

```bash
npm run styles:build
```

## 许可证

[MIT](./LICENSE)
