import { FILE_EDIT_GROUP_TOOL_NAME } from '../../core/agent/builtinToolUiMeta'
import type { ToolCapabilityMode } from '../../core/agent/tool-capability-prompt'
import type { AgentRuntimeLoopConfig } from '../../core/agent/types'
import { getBuiltinToolNamespace } from '../../core/tools/localFileTools'
import { getToolName } from '../../core/tools/tool-name-utils'
import type { Assistant } from '../../types/assistant.types'

import type { ChatMode } from './chat-input/ChatModeSelect'
import { isAgentChatMode } from './chat-input/ChatModeSelect'

type AssistantRuntimeOptions = Pick<
  Assistant,
  'enableTools' | 'includeBuiltinTools' | 'toolPreferences'
>

export const DEFAULT_AGENT_MAX_AUTO_ITERATIONS = 100

export const CHAT_BLOCKED_TOOL_NAMES: readonly string[] = [
  getToolName(getBuiltinToolNamespace(), 'fs_file_ops'),
  getToolName(getBuiltinToolNamespace(), FILE_EDIT_GROUP_TOOL_NAME),
  getToolName(getBuiltinToolNamespace(), 'fs_edit'),
  getToolName(getBuiltinToolNamespace(), 'fs_write'),
  getToolName(getBuiltinToolNamespace(), 'fs_delete'),
  getToolName(getBuiltinToolNamespace(), 'fs_create_dir'),
  getToolName(getBuiltinToolNamespace(), 'fs_move'),
  getToolName(getBuiltinToolNamespace(), 'terminal_command'),
  getToolName(getBuiltinToolNamespace(), 'todo_write'),
]

export type ChatModeRuntime = {
  loopConfig: AgentRuntimeLoopConfig
  allowedToolNames: string[] | undefined
  toolPreferences: Assistant['toolPreferences']
  bypassToolApproval: boolean
  toolCapabilityMode: ToolCapabilityMode
}

export type ChatModeRuntimeInput = {
  mode: ChatMode
  /**
   * Auto-approve tool calls (YOLO). Orthogonal to `mode`; only takes effect in
   * Agent mode.
   */
  yoloEnabled?: boolean
  assistant?: AssistantRuntimeOptions | null
  assistantEnabledToolNames: string[]
}

export function resolveChatModeRuntime({
  mode,
  yoloEnabled = false,
  assistant,
  assistantEnabledToolNames,
}: ChatModeRuntimeInput): ChatModeRuntime {
  const enableTools = assistant?.enableTools ?? true
  const includeBuiltinTools = enableTools
    ? (assistant?.includeBuiltinTools ?? true)
    : false

  const isAgentMode = isAgentChatMode(mode)
  const blocked = new Set(CHAT_BLOCKED_TOOL_NAMES)
  const allowedToolNames = enableTools
    ? isAgentMode
      ? assistantEnabledToolNames
      : assistantEnabledToolNames.filter((name) => !blocked.has(name))
    : undefined

  return {
    loopConfig: {
      enableTools,
      includeBuiltinTools,
      maxAutoIterations: DEFAULT_AGENT_MAX_AUTO_ITERATIONS,
    },
    allowedToolNames,
    // The allowed-name list controls which tools Ask mode may see, while the
    // preference map is still required by the execution gateway to confirm
    // that those tools are enabled. Dropping it here advertises safe tools
    // such as fs_read to the model and then rejects the same call at runtime.
    toolPreferences: assistant?.toolPreferences,
    bypassToolApproval: isAgentMode && yoloEnabled,
    toolCapabilityMode: isAgentMode ? 'agent' : 'ask',
  }
}
