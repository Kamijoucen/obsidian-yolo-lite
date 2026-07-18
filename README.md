# YOLO-Lite

YOLO-Lite 是一个面向 Obsidian 的轻量级 AI Agent 插件，专注于对话、Vault 操作、任务执行、Skills 与联网搜索。

它将模型对话、文件工具、终端和子 Agent 集中在 Obsidian 侧边栏中，让 AI 可以在明确的权限与工作区范围内读取笔记、修改文件并完成多步骤任务。

## 主要功能

- 在侧边栏中创建和管理多个对话
- 支持 Ask 与 Agent 两种运行模式
- Agent 可使用 Vault 搜索、文件读写和桌面终端工具
- 支持子 Agent、后台任务、待办状态与工具审批
- 文件修改提供差异预览和确认流程
- 支持自定义 Assistant、系统提示词、模型与推理参数
- 支持可复用 Skills
- 按目录读取 `AGENTS.md` 和 `CLAUDE.md` 项目指令
- 支持可配置的联网搜索
- 支持图片、Office 文档和文本附件

## Agent 模式

Ask 模式适合问答、阅读和分析，默认限制文件修改、终端执行等有副作用的工具。

Agent 模式面向完整任务，可以在授权范围内调用文件、终端和子 Agent 工具。需要确认的操作会进入审批状态，任务也可以在切换笔记或对话后继续于后台运行。

每个 Assistant 都可以独立配置工作区范围、可用工具、审批策略、提示词和模型。

## 模型供应商

YOLO-Lite 内置支持：

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

模型主要通过 OpenAI 兼容的 Chat Completions 或 Responses 协议接入。

## 安装

将以下文件放入 Vault 的 `.obsidian/plugins/yolo-lite/`：

- `manifest.json`
- `main.js`
- `styles.css`

随后打开 Obsidian，在「设置 → 第三方插件」中启用 YOLO-Lite。

## 项目来源

YOLO-Lite 基于 [lapis0x0/obsidian-yolo](https://github.com/lapis0x0/obsidian-yolo) 裁剪并重构；两个项目独立开发，YOLO-Lite 不保证与原版保持配置兼容或功能同步。

相较原版，YOLO-Lite 将 Smart Space、Quick Ask、选区聊天、Tab 补全、PDF、学习系统、PGlite/RAG、MCP 接入与服务、自更新及非 OpenAI/国产模型相关实现连同对应代码、配置、界面和依赖直接移除，集中保留 Agent 主链路。

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

开发时可以将仓库软连接到测试 Vault：

```text
<vault>/.obsidian/plugins/yolo-lite
```

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
