import type { App } from 'obsidian'

export const AGENTS_MD_FILE = 'AGENTS.md'
export const MANAGED_BLOCK_START = '<!-- yolo-lite:start -->'
export const MANAGED_BLOCK_END = '<!-- yolo-lite:end -->'

export const DEFAULT_SYSTEM_PROMPT = `你是 Obsidian 笔记库中的 AI 笔记助手。你的主要职责是帮助用户查阅资料、整理与修改笔记，而不是完成软件工程任务。

工作方式：
- 默认使用中文回答（除非用户用其他语言提问）。
- 当前工作目录就是用户的 Obsidian 笔记库根目录，库中的 .md 文件即用户的笔记。
- 修改笔记时尽量做小范围编辑，保留原文的格式、frontmatter、标签与双链，不要无故重写整篇笔记。
- 引用或提及笔记时使用 Obsidian 双链格式 [[笔记名]]。
- 新建笔记使用规范的 Markdown 与 Obsidian 语法（callout、wiki 链接、标签），标题简洁清晰。
- 查阅资料时说明信息来源；不确定或无法核实的内容要明确标注，不要编造。
- 优先使用文件读写工具完成操作，终端命令仅在确有必要时使用。
- 回答保持简洁，直接给出结论与建议的修改，需要用户确认的大改动先说明方案再动手。`

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Upserts the plugin-managed block inside an AGENTS.md document, preserving
 * any user content outside the managed markers.
 */
export function upsertManagedBlock(
  existing: string,
  blockContent: string,
): string {
  const block = `${MANAGED_BLOCK_START}\n${blockContent.trim()}\n${MANAGED_BLOCK_END}`
  const pattern = new RegExp(
    `${escapeRegExp(MANAGED_BLOCK_START)}[\\s\\S]*?${escapeRegExp(MANAGED_BLOCK_END)}`,
  )
  if (pattern.test(existing)) {
    return existing.replace(pattern, block)
  }
  const trimmed = existing.trimEnd()
  if (!trimmed) {
    return `${block}\n`
  }
  return `${trimmed}\n\n${block}\n`
}

/**
 * Removes the managed block (used when the feature is disabled), collapsing
 * excess blank lines left behind.
 */
export function removeManagedBlock(existing: string): string {
  const pattern = new RegExp(
    `\\n*${escapeRegExp(MANAGED_BLOCK_START)}[\\s\\S]*?${escapeRegExp(MANAGED_BLOCK_END)}\\n?`,
  )
  return existing.replace(pattern, '\n').trim()
}

/**
 * Writes (or removes) the plugin-managed block in the vault-root AGENTS.md.
 * opencode picks up AGENTS.md as project rules for every session.
 */
export async function syncAgentsMd(
  app: App,
  prompt: string,
  enabled: boolean,
): Promise<void> {
  const adapter = app.vault.adapter
  const exists = await adapter.exists(AGENTS_MD_FILE)
  const current = exists ? await adapter.read(AGENTS_MD_FILE) : ''
  if (!enabled) {
    if (!exists || !current.includes(MANAGED_BLOCK_START)) return
    const next = removeManagedBlock(current)
    if (next !== current) {
      await adapter.write(AGENTS_MD_FILE, next)
    }
    return
  }
  const next = upsertManagedBlock(current, prompt)
  if (next !== current) {
    await adapter.write(AGENTS_MD_FILE, next)
  }
}
