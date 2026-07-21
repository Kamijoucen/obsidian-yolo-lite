# YOLO-Lite

YOLO-Lite 是一个面向 Obsidian 的轻量级 AI 笔记助手插件。它本身**不包含任何 Agent / 模型实现**，而是通过 [Agent Client Protocol](https://agentclientprotocol.com)（ACP）接入 [opencode](https://opencode.ai) 作为后端，在 Obsidian 侧边栏中提供对话界面。

模型接入、工具执行、文件编辑、终端命令、计划模式、会话历史与记忆全部由 opencode 原生维护。

## 工作原理

```
Obsidian 插件 (ACP Client)  ──stdio / JSON-RPC──▶  opencode acp (子进程)
```

- 插件以子进程方式启动 `opencode acp`，通过 ACP 协议通信（官方 SDK `@agentclientprotocol/sdk`)
- 会话由 opencode 持久化；启动时自动打开最近一次会话（`session/list` + `session/load` 回放）
- 工具权限请求（`session/request_permission`）在插件内以审批卡片呈现；开启 YOLO 开关后自动批准
- 文件读写能力（`fs/read_text_file` / `fs/write_text_file`）经 Obsidian vault adapter 实现，并强制限制在 vault 根目录内
- 笔记助手提示词通过 vault 根目录 `AGENTS.md` 的托管区块注入（opencode 项目规则）

## 前置条件

1. 安装 opencode:

   ```bash
   curl -fsSL https://opencode.ai/install | bash
   ```

2. 配置模型供应商认证：

   ```bash
   opencode auth login
   ```

3. 仅限桌面端 Obsidian（需要 Node 子进程能力，移动端不可用）。

## 安装

将以下文件放入 Vault 的 `.obsidian/plugins/yolo-lite/`：

- `manifest.json`
- `main.js`
- `styles.css`

随后打开 Obsidian，在「设置 → 第三方插件」中启用 YOLO-Lite。

## 功能

- **笔记助手提示词**：默认注入面向笔记场景的提示词（查资料、小范围改稿、保留 frontmatter/双链），可在设置中编辑或关闭
- **启动即用**：自动恢复最近一次会话；模型与思考强度选择器在启动后即从 opencode 拉取
- **流式输出**：逐字渲染，推理过程（thinking）可折叠查看
- **工具调用卡片**：读 / 写 / 编辑 / 终端 / 搜索等工具的状态与输出，编辑内容 diff 预览
- **权限审批**：允许一次 / 总是允许 / 拒绝；YOLO 模式自动批准全部请求
- **模式切换**:plan（只读）/ build（可修改）映射 opencode session mode
- **模型切换**：列出 opencode 已配置的全部模型，按会话切换
- **思考强度切换**：对支持推理的模型显示 effort 选项（low/high/max 等）
- **斜杠命令**：输入 `/` 唤起 opencode commands / skills
- **图片附件**：粘贴或选择图片，随消息发送
- **历史会话**：下拉列表打开 opencode 持久化的历史对话（空会话自动隐藏）

## 设置

- **opencode 二进制路径**：留空则从 PATH 解析
- **额外 ACP 参数**：追加在 `opencode acp` 之后
- **默认模式**:plan（只读）或 build
- **自动批准权限（YOLO)**：所有权限请求自动放行
- **笔记助手提示词**：写入库根目录 `AGENTS.md` 托管区块的提示词
- **托管 AGENTS.md**：关闭后自动移除托管区块，不再注入提示词
- **显示推理过程 / 调试日志**

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

开发时可以将仓库软连接到测试 Vault:

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

## 架构

```text
src/
  main.ts                 插件入口（视图 / 命令 / 状态栏 / 设置 / AGENTS.md 同步)
  ChatView.tsx            ItemView 宿主
  core/acp/               ACP 客户端
    process.ts            opencode 子进程（异步 shell env / spawn)
    client.ts             SDK 连接、initialize、客户端能力注册
    service.ts            会话服务（标签、提交、取消、模式、历史、配置项、权限路由)
    mapper.ts             session/update → 时间线状态（不可变更新，驱动流式渲染)
    permissions.ts        权限请求生命周期（YOLO 自动批准）
    fsBridge.ts           vault adapter 文件读写 + 路径防护
    agentsMd.ts           AGENTS.md 托管区块（笔记助手提示词注入)
  components/chat/        聊天 UI（顶栏 / 时间线 / 工具卡片 / 选择器 / 输入框)
  types/chat.ts           会话状态模型
  settings/               设置 schema 与设置页
```

## 许可证

[MIT](./LICENSE)
