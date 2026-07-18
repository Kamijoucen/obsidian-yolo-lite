import {
  App,
  MarkdownView,
  TFile,
  TFolder,
  Vault,
  WorkspaceLeaf,
} from 'obsidian'

import { CHAT_VIEW_TYPE } from '../constants'

export async function readTFileContent(
  file: TFile,
  vault: Vault,
): Promise<string> {
  return await vault.cachedRead(file)
}

export function getNestedFiles(folder: TFolder, vault: Vault): TFile[] {
  const files: TFile[] = []
  for (const child of folder.children) {
    if (child instanceof TFile) {
      files.push(child)
    } else if (child instanceof TFolder) {
      files.push(...getNestedFiles(child, vault))
    }
  }
  return files
}

export function getOpenFiles(app: App): TFile[] {
  try {
    const leaves = app.workspace.getLeavesOfType('markdown')
    return leaves
      .map((leaf) =>
        leaf.view instanceof MarkdownView ? leaf.view.file : null,
      )
      .filter((file): file is TFile => Boolean(file))
  } catch {
    return []
  }
}

export function calculateFileDistance(
  file1: TFile | TFolder | { path: string },
  file2: TFile | TFolder | { path: string },
): number | null {
  // Prefer runtime type checks against Obsidian types when available
  const hasStringPath = (obj: unknown): obj is { path: string } =>
    typeof obj === 'object' &&
    obj !== null &&
    'path' in obj &&
    typeof (obj as Record<string, unknown>).path === 'string'

  const getPath = (f: TFile | TFolder | { path: string }): string => {
    if (f instanceof TFile || f instanceof TFolder) return f.path
    if (hasStringPath(f)) return f.path
    throw new Error(
      'Invalid argument: expected TFile/TFolder or object with path',
    )
  }

  const path1 = getPath(file1).split('/')
  const path2 = getPath(file2).split('/')

  // Check if files are in different top-level folders
  if (path1[0] !== path2[0]) {
    return null
  }

  let distance = 0
  let i = 0

  // Find the common ancestor
  while (i < path1.length && i < path2.length && path1[i] === path2[i]) {
    i++
  }

  // Calculate distance from common ancestor to each file
  distance += path1.length - i
  distance += path2.length - i

  return distance
}

/**
 * 在主编辑区（rootSplit）新建一个 tab 并返回。
 *
 * 直接调用 `workspace.getLeaf('tab')` 会基于当前 active leaf 的父 split 新开 tab，
 * 当聊天视图处于激活状态时，新 tab 会被塞进 chat 那一栏（无论 chat 在侧边栏还是
 * 主区的某个 split 里），覆盖聊天面板。这里需要锁定一个非 chat 的主区 leaf 作为
 * 锚点，再让 Obsidian 在它旁边新开 tab。
 */
function openTabInMainArea(app: App): WorkspaceLeaf {
  const anchor = findMainAreaAnchorLeaf(app)
  if (anchor) {
    app.workspace.setActiveLeaf(anchor, { focus: false })
    return app.workspace.getLeaf('tab')
  }

  // 主区只剩 chat：在 chat 右侧 split 一个新 leaf（贴合多数编辑器"预览/跳转打开在右侧"的直觉）。
  const chatLeaf = app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]
  if (chatLeaf) {
    return app.workspace.createLeafBySplit(chatLeaf, 'vertical', false)
  }

  return app.workspace.getLeaf(false)
}

function findMainAreaAnchorLeaf(app: App): WorkspaceLeaf | null {
  const recent = app.workspace.getMostRecentLeaf(app.workspace.rootSplit)
  if (recent && recent.view.getViewType() !== CHAT_VIEW_TYPE) {
    return recent
  }

  let anchor: WorkspaceLeaf | null = null
  app.workspace.iterateRootLeaves((leaf) => {
    if (anchor) return
    if (leaf.view.getViewType() === CHAT_VIEW_TYPE) return
    anchor = leaf
  })
  return anchor
}

export function openMarkdownFile(
  app: App,
  filePath: string,
  startLine?: number,
) {
  const file = app.vault.getFileByPath(filePath)
  if (!file) return

  const existingLeaf = app.workspace
    .getLeavesOfType('markdown')
    .find(
      (leaf) =>
        leaf.view instanceof MarkdownView && leaf.view.file?.path === file.path,
    )

  if (existingLeaf) {
    app.workspace.setActiveLeaf(existingLeaf, { focus: true })

    if (startLine && existingLeaf.view instanceof MarkdownView) {
      existingLeaf.view.setEphemeralState({ line: startLine - 1 }) // -1 because line is 0-indexed
    }
  } else {
    const leaf = openTabInMainArea(app)
    void leaf.openFile(file, {
      eState: startLine ? { line: startLine - 1 } : undefined, // -1 because line is 0-indexed
    })
  }
}
