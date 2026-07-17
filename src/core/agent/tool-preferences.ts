import type {
  Assistant,
  AssistantToolApprovalMode,
  AssistantToolPreference,
} from '../../types/assistant.types'
import { JS_SANDBOX_TOOL_NAME } from '../tools/jsSandboxTool'
import {
  LOCAL_FS_SPLIT_ACTION_TOOL_NAMES,
  USER_FACING_LOCAL_TOOL_SHORT_NAMES,
  getBuiltinToolNamespace,
} from '../tools/localFileTools'
import { getToolName, parseToolName } from '../tools/tool-name-utils'

import { FILE_EDIT_GROUP_TOOL_NAME } from './builtinToolUiMeta'

export const DEFAULT_ASSISTANT_TOOL_APPROVAL_MODE: AssistantToolApprovalMode =
  'require_approval'

export const ALWAYS_ALLOW_DISABLED_TOOL_NAMES: readonly string[] = [
  'terminal_command',
]

const REQUIRE_APPROVAL_LOCAL_TOOLS: ReadonlySet<string> = new Set([
  FILE_EDIT_GROUP_TOOL_NAME,
  'fs_file_ops',
  ...LOCAL_FS_SPLIT_ACTION_TOOL_NAMES,
  'terminal_command',
])

export const BUILTIN_DEFAULT_DISABLED_TOOL_SHORT_NAMES: ReadonlySet<string> =
  new Set([
    'context_prune_tool_results',
    'context_compact',
    'delegate_subagent',
    JS_SANDBOX_TOOL_NAME,
    'terminal_command',
  ])

const USER_FACING_LOCAL_TOOL_SHORT_NAME_SET: ReadonlySet<string> = new Set(
  USER_FACING_LOCAL_TOOL_SHORT_NAMES,
)

export const BUILTIN_DEFAULT_ENABLED_TOOL_FQNS: readonly string[] =
  USER_FACING_LOCAL_TOOL_SHORT_NAMES.filter(
    (name) => !BUILTIN_DEFAULT_DISABLED_TOOL_SHORT_NAMES.has(name),
  ).map((name) => getToolName(getBuiltinToolNamespace(), name))

const isBuiltinToolName = (toolName: string): boolean => {
  try {
    return parseToolName(toolName).namespace === getBuiltinToolNamespace()
  } catch {
    return false
  }
}

export const getDefaultEnabledForTool = (toolName: string): boolean => {
  try {
    const { namespace, toolName: shortName } = parseToolName(toolName)
    return (
      namespace === getBuiltinToolNamespace() &&
      USER_FACING_LOCAL_TOOL_SHORT_NAME_SET.has(shortName) &&
      !BUILTIN_DEFAULT_DISABLED_TOOL_SHORT_NAMES.has(shortName)
    )
  } catch {
    return false
  }
}

export const getDefaultApprovalModeForTool = (
  toolName: string,
): AssistantToolApprovalMode => {
  try {
    const { namespace, toolName: shortName } = parseToolName(toolName)
    if (namespace !== getBuiltinToolNamespace()) {
      return DEFAULT_ASSISTANT_TOOL_APPROVAL_MODE
    }
    return REQUIRE_APPROVAL_LOCAL_TOOLS.has(shortName)
      ? 'require_approval'
      : 'full_access'
  } catch {
    return DEFAULT_ASSISTANT_TOOL_APPROVAL_MODE
  }
}

export const buildDefaultBuiltinToolPreferences = (): Record<
  string,
  AssistantToolPreference
> =>
  Object.fromEntries(
    BUILTIN_DEFAULT_ENABLED_TOOL_FQNS.map((name) => [
      name,
      {
        enabled: true,
        approvalMode: getDefaultApprovalModeForTool(name),
      },
    ]),
  )

export const getAssistantToolPreferences = (
  assistant?: Pick<Assistant, 'toolPreferences'> | null,
): Record<string, AssistantToolPreference> => assistant?.toolPreferences ?? {}

export const getEnabledAssistantToolNames = (
  assistant?: Pick<Assistant, 'toolPreferences' | 'includeBuiltinTools'> | null,
): string[] => {
  if (assistant?.includeBuiltinTools === false) {
    return []
  }
  return Object.entries(getAssistantToolPreferences(assistant))
    .filter(([name, preference]) =>
      Boolean(preference.enabled && isBuiltinToolName(name)),
    )
    .map(([name]) => name)
}

export const isAssistantToolEnabled = (
  assistant: Pick<Assistant, 'toolPreferences'> | null | undefined,
  toolName: string,
): boolean =>
  isBuiltinToolName(toolName) &&
  (getAssistantToolPreferences(assistant)[toolName]?.enabled ?? false)

export const getAssistantToolApprovalMode = (
  assistant: Pick<Assistant, 'toolPreferences'> | null | undefined,
  toolName: string,
): AssistantToolApprovalMode =>
  getAssistantToolPreferences(assistant)[toolName]?.approvalMode ??
  getDefaultApprovalModeForTool(toolName)
