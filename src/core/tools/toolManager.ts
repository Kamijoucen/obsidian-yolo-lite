import { App } from 'obsidian'

import { YoloSettings } from '../../settings/schema/setting.types'
import type { ApplyViewState } from '../../types/apply-view.types'
import type { AssistantWorkspaceScope } from '../../types/assistant.types'
import type { ChatMessage } from '../../types/chat'
import {
  ToolCallResponse,
  ToolCallResponseStatus,
} from '../../types/tool-call.types'
import type { ToolDefinition } from '../../types/tool.types'
import {
  FILE_EDIT_GROUP_TOOL_NAME,
  FILE_OPS_GROUP_TOOL_NAME,
  WEB_OPS_GROUP_TOOL_NAME,
} from '../agent/builtinToolUiMeta'
import type { PromptSourceWatcher } from '../agent/promptSourceWatcher'
import type { SubagentParentContext } from '../agent/subagent/parent-context'
import {
  WEB_SCRAPE_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
  isWebSearchToolReady,
} from '../web-search'

import {
  type JsSandboxSettings,
  getJsSandboxSettings,
} from './jsSandboxSettings'
import { disposeJsSandbox } from './jsSandboxTool'
import {
  LOCAL_FS_EDIT_TOOL_NAMES,
  LOCAL_FS_PATH_OPERATION_TOOL_NAMES,
  LOCAL_MEMORY_SPLIT_ACTION_TOOL_NAMES,
  callLocalFileTool,
  getBuiltinToolNamespace,
  getLocalFileTools,
  parseLocalFsActionFromToolArgs,
} from './localFileTools'
import {
  InvalidToolNameError,
  getToolName,
  parseToolName,
} from './tool-name-utils'

const LOCAL_FS_EDIT_TOOL_NAME_SET = new Set<string>(LOCAL_FS_EDIT_TOOL_NAMES)
const LOCAL_FS_PATH_OPERATION_TOOL_NAME_SET = new Set<string>(
  LOCAL_FS_PATH_OPERATION_TOOL_NAMES,
)
const LOCAL_MEMORY_SPLIT_TOOL_NAME_SET = new Set<string>(
  LOCAL_MEMORY_SPLIT_ACTION_TOOL_NAMES,
)

export class ToolManager {
  public static readonly TOOL_NAME_DELIMITER = '__'

  private readonly app: App
  private readonly openApplyReview: (state: ApplyViewState) => Promise<boolean>
  private readonly promptSourceWatcher?: PromptSourceWatcher
  private settings: YoloSettings
  private readonly unsubscribeFromSettings: () => void
  private readonly activeToolCalls = new Map<string, AbortController>()
  private readonly allowedToolsByConversation = new Map<string, Set<string>>()
  private availableToolsCache: ToolDefinition[] | null = null

  constructor({
    app,
    settings,
    openApplyReview,
    registerSettingsListener,
    promptSourceWatcher,
  }: {
    app: App
    settings: YoloSettings
    openApplyReview: (state: ApplyViewState) => Promise<boolean>
    registerSettingsListener: (
      listener: (settings: YoloSettings) => void,
    ) => () => void
    promptSourceWatcher?: PromptSourceWatcher
  }) {
    this.app = app
    this.settings = settings
    this.openApplyReview = openApplyReview
    this.promptSourceWatcher = promptSourceWatcher
    this.unsubscribeFromSettings = registerSettingsListener((nextSettings) => {
      this.settings = nextSettings
      this.availableToolsCache = null
    })
  }

  public cleanup(): void {
    this.unsubscribeFromSettings()
    for (const controller of this.activeToolCalls.values()) {
      controller.abort()
    }
    this.activeToolCalls.clear()
    this.allowedToolsByConversation.clear()
    this.availableToolsCache = null
    disposeJsSandbox()
  }

  public getJsSandboxSettings(): JsSandboxSettings {
    return getJsSandboxSettings(this.settings)
  }

  public getSettingsSnapshot(): YoloSettings {
    return this.settings
  }

  public async listAvailableTools({
    includeBuiltinTools = false,
  }: {
    includeBuiltinTools?: boolean
  } = {}): Promise<ToolDefinition[]> {
    if (!includeBuiltinTools) {
      return []
    }
    if (!this.availableToolsCache) {
      this.availableToolsCache = getLocalFileTools()
        .filter((tool) => this.isLocalToolEnabled(tool.name))
        .map((tool) => ({
          ...tool,
          name: getToolName(getBuiltinToolNamespace(), tool.name),
        }))
    }
    return [...this.availableToolsCache]
  }

  public allowToolForConversation(
    requestToolName: string,
    conversationId: string,
    requestArgs?: Record<string, unknown>,
  ): void {
    const allowedTools =
      this.allowedToolsByConversation.get(conversationId) ?? new Set<string>()
    this.allowedToolsByConversation.set(conversationId, allowedTools)
    allowedTools.add(
      this.buildExecutionAllowanceKey({ requestToolName, requestArgs }),
    )
    allowedTools.add(requestToolName)
  }

  public isToolExecutionAllowed({
    requestToolName,
    conversationId,
    requestArgs,
    requireAutoExecution = false,
  }: {
    requestToolName: string
    conversationId?: string
    requestArgs?: Record<string, unknown>
    requireAutoExecution?: boolean
  }): boolean {
    try {
      const { namespace, toolName } = parseToolName(requestToolName)
      if (
        namespace !== getBuiltinToolNamespace() ||
        !this.isLocalToolEnabled(toolName)
      ) {
        return false
      }
      if (!conversationId) {
        return requireAutoExecution
      }
      const allowedTools = this.allowedToolsByConversation.get(conversationId)
      return Boolean(
        allowedTools?.has(
          this.buildExecutionAllowanceKey({ requestToolName, requestArgs }),
        ) ||
          allowedTools?.has(requestToolName) ||
          requireAutoExecution,
      )
    } catch (error) {
      if (error instanceof InvalidToolNameError) {
        return false
      }
      throw error
    }
  }

  public async callTool({
    name,
    args,
    id,
    conversationId,
    roundId,
    conversationMessages,
    signal,
    requireReview = false,
    chatModelId,
    workspaceScope,
    allowedSkillPaths,
    subagentParentContext,
  }: {
    name: string
    args?: Record<string, unknown>
    id?: string
    conversationId?: string
    roundId?: string
    conversationMessages?: ChatMessage[]
    signal?: AbortSignal
    requireReview?: boolean
    chatModelId?: string
    workspaceScope?: AssistantWorkspaceScope
    allowedSkillPaths?: readonly string[]
    subagentParentContext?: SubagentParentContext
  }): Promise<ToolCallResponse> {
    const controller = new AbortController()
    if (id !== undefined) {
      this.activeToolCalls.get(id)?.abort()
      this.activeToolCalls.set(id, controller)
    }
    signal?.addEventListener('abort', () => controller.abort(), { once: true })

    try {
      const { namespace, toolName } = parseToolName(name)
      if (namespace !== getBuiltinToolNamespace()) {
        throw new Error(`Unknown internal tool namespace: ${namespace}`)
      }
      if (!this.isLocalToolEnabled(toolName)) {
        throw new Error(`Built-in tool ${toolName} is disabled`)
      }
      const result = await callLocalFileTool({
        app: this.app,
        settings: this.settings,
        openApplyReview: this.openApplyReview,
        conversationId,
        conversationMessages,
        roundId,
        toolCallId: id,
        toolName,
        args: args ?? {},
        requireReview,
        signal: controller.signal,
        chatModelId,
        workspaceScope,
        allowedSkillPaths,
        subagentParentContext,
        promptSourceWatcher: this.promptSourceWatcher,
      })
      if (result.status === ToolCallResponseStatus.Success) {
        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: result.text,
            contentParts: result.contentParts,
            metadata: result.metadata,
          },
        }
      }
      if (result.status === ToolCallResponseStatus.Aborted) {
        return {
          status: ToolCallResponseStatus.Aborted,
          ...(result.data !== undefined && { data: result.data }),
        }
      }
      if (result.status === ToolCallResponseStatus.Rejected) {
        return { status: ToolCallResponseStatus.Rejected }
      }
      return { status: ToolCallResponseStatus.Error, error: result.error }
    } catch (error) {
      if (controller.signal.aborted) {
        return { status: ToolCallResponseStatus.Aborted }
      }
      return {
        status: ToolCallResponseStatus.Error,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    } finally {
      if (id !== undefined) {
        this.activeToolCalls.delete(id)
      }
    }
  }

  public abortToolCall(id: string): boolean {
    const controller = this.activeToolCalls.get(id)
    if (!controller) {
      return false
    }
    controller.abort()
    this.activeToolCalls.delete(id)
    return true
  }

  private buildExecutionAllowanceKey({
    requestToolName,
    requestArgs,
  }: {
    requestToolName: string
    requestArgs?: Record<string, unknown>
  }): string {
    try {
      const { namespace, toolName } = parseToolName(requestToolName)
      const action =
        namespace === getBuiltinToolNamespace()
          ? parseLocalFsActionFromToolArgs({ toolName, args: requestArgs })
          : null
      return action ? `${requestToolName}::${action}` : requestToolName
    } catch {
      return requestToolName
    }
  }

  private isLocalToolEnabled(toolName: string): boolean {
    const options = this.settings.tools.builtinToolOptions
    if (
      toolName === WEB_SEARCH_TOOL_NAME ||
      toolName === WEB_SCRAPE_TOOL_NAME
    ) {
      if (
        options[WEB_OPS_GROUP_TOOL_NAME]?.disabled ||
        options[toolName]?.disabled
      ) {
        return false
      }
      return (
        toolName !== WEB_SEARCH_TOOL_NAME ||
        isWebSearchToolReady(this.settings.webSearch)
      )
    }
    if (LOCAL_FS_EDIT_TOOL_NAME_SET.has(toolName)) {
      return !(
        options[toolName]?.disabled ||
        options[FILE_EDIT_GROUP_TOOL_NAME]?.disabled
      )
    }
    if (LOCAL_FS_PATH_OPERATION_TOOL_NAME_SET.has(toolName)) {
      return !(
        options[toolName]?.disabled ||
        options[FILE_OPS_GROUP_TOOL_NAME]?.disabled
      )
    }
    if (LOCAL_MEMORY_SPLIT_TOOL_NAME_SET.has(toolName)) {
      return !(options[toolName]?.disabled || options.memory_ops?.disabled)
    }
    return !(options[toolName]?.disabled ?? false)
  }
}
