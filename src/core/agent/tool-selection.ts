import type { YoloSettings } from '../../settings/schema/setting.types'
import type { RequestTool } from '../../types/llm/request'
import type { ToolDefinition } from '../../types/tool.types'
import { type JsSandboxSettings } from '../tools/jsSandboxSettings'
import { JS_SANDBOX_TOOL_NAME, getJsSandboxTool } from '../tools/jsSandboxTool'
import {
  LOCAL_FS_EDIT_TOOL_NAMES,
  LOCAL_FS_PATH_OPERATION_TOOL_NAMES,
  LOCAL_MEMORY_SPLIT_ACTION_TOOL_NAMES,
  getBuiltinToolNamespace,
} from '../tools/localFileTools'
import { parseToolName } from '../tools/tool-name-utils'
import { ToolManager } from '../tools/toolManager'

import { FILE_EDIT_GROUP_TOOL_NAME } from './builtinToolUiMeta'
import {
  formatSubagentModelOption,
  resolveSubagentModelConfig,
} from './subagent/model-config'

const LOCAL_MEMORY_TOOL_NAMES = new Set([
  'memory_ops',
  'memory_add',
  'memory_update',
  'memory_delete',
])

export const expandAllowedToolNames = (
  toolNames?: string[],
): Set<string> | undefined => {
  if (!toolNames) {
    return undefined
  }

  const expanded = new Set<string>(toolNames)
  const builtinNamespace = getBuiltinToolNamespace()
  const localFileEditTool = `${builtinNamespace}${ToolManager.TOOL_NAME_DELIMITER}${FILE_EDIT_GROUP_TOOL_NAME}`
  const localFileOpsTool = `${builtinNamespace}${ToolManager.TOOL_NAME_DELIMITER}fs_file_ops`
  const localMemoryOpsTool = `${builtinNamespace}${ToolManager.TOOL_NAME_DELIMITER}memory_ops`
  const hasFileEditGroup =
    expanded.has(localFileEditTool) || expanded.has(FILE_EDIT_GROUP_TOOL_NAME)
  const hasFileOpsGroup =
    expanded.has(localFileOpsTool) || expanded.has('fs_file_ops')
  const hasMemoryOpsGroup =
    expanded.has(localMemoryOpsTool) || expanded.has('memory_ops')

  if (hasFileEditGroup) {
    for (const splitToolName of LOCAL_FS_EDIT_TOOL_NAMES) {
      expanded.add(
        `${builtinNamespace}${ToolManager.TOOL_NAME_DELIMITER}${splitToolName}`,
      )
      expanded.add(splitToolName)
    }
  }

  if (hasFileOpsGroup) {
    for (const splitToolName of LOCAL_FS_PATH_OPERATION_TOOL_NAMES) {
      expanded.add(
        `${builtinNamespace}${ToolManager.TOOL_NAME_DELIMITER}${splitToolName}`,
      )
      expanded.add(splitToolName)
    }
  }

  if (hasMemoryOpsGroup) {
    for (const splitToolName of LOCAL_MEMORY_SPLIT_ACTION_TOOL_NAMES) {
      expanded.add(
        `${builtinNamespace}${ToolManager.TOOL_NAME_DELIMITER}${splitToolName}`,
      )
      expanded.add(splitToolName)
    }
  }

  return expanded
}

export const isMemoryToolAvailable = (toolName: string): boolean => {
  try {
    const parsed = parseToolName(toolName)
    return (
      parsed.namespace === getBuiltinToolNamespace() &&
      LOCAL_MEMORY_TOOL_NAMES.has(parsed.toolName)
    )
  } catch {
    return LOCAL_MEMORY_TOOL_NAMES.has(toolName)
  }
}

const isToolAllowed = ({
  toolName,
  allowedToolNames,
}: {
  toolName: string
  allowedToolNames?: ReadonlySet<string>
}): boolean => {
  if (!allowedToolNames) {
    return true
  }

  return allowedToolNames.has(toolName)
}

export const buildRequestTools = (
  toolDefinitions: ToolDefinition[],
): RequestTool[] | undefined => {
  if (toolDefinitions.length === 0) {
    return undefined
  }

  return toolDefinitions.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        ...tool.inputSchema,
        properties: tool.inputSchema.properties ?? {},
      },
    },
  }))
}

/**
 * Rewrite tools whose schema depends on global settings. Currently only
 * `js_eval`, whose description and `timeoutMs` input bound both name the
 * exact `settings.jsSandbox` values in effect (network / vault read / $db /
 * external scripts / browser page reads + per-call timeout cap).
 *
 * The tool list from `listAvailableTools` is cached and settings-agnostic —
 * this is the single bridge that rebuilds the live tool spec. Every consumer
 * that surfaces a tool description/schema to the model OR estimates its
 * token cost must route through here, otherwise the shown/estimated surface
 * drifts from what the request actually sends.
 */
export function applyDynamicToolDescriptions(
  tools: ToolDefinition[],
  ctx: {
    jsSandboxSettings: JsSandboxSettings
    settings?: YoloSettings
  },
): ToolDefinition[] {
  const jsSandboxFqn = `${getBuiltinToolNamespace()}${ToolManager.TOOL_NAME_DELIMITER}${JS_SANDBOX_TOOL_NAME}`
  const delegateSubagentFqn = `${getBuiltinToolNamespace()}${ToolManager.TOOL_NAME_DELIMITER}delegate_subagent`
  return tools.map((tool) => {
    if (tool.name === jsSandboxFqn) {
      const live = getJsSandboxTool(ctx.jsSandboxSettings)
      return {
        ...tool,
        description: live.description,
        inputSchema: live.inputSchema,
      }
    }

    if (tool.name === delegateSubagentFqn && ctx.settings) {
      return applySubagentModelSchema(tool, ctx.settings)
    }

    return tool
  })
}

function applySubagentModelSchema(
  tool: ToolDefinition,
  settings: YoloSettings,
): ToolDefinition {
  const config = resolveSubagentModelConfig(settings)
  const allowedLines = config.allowedModelIds
    .map((modelId) => `- ${formatSubagentModelOption(settings, modelId)}`)
    .join('\n')
  const preferredLine = config.preferredModelId
    ? formatSubagentModelOption(settings, config.preferredModelId)
    : 'none'
  const modelDescription =
    config.allowedModelIds.length > 0
      ? `Optional modelId for this sub-agent. Allowed modelIds:\n${allowedLines}\nRecommended default: ${preferredLine}. If the user did not explicitly request a model, omit this field and the host will use the recommended default.`
      : 'Optional modelId for this sub-agent. No registered chat models are currently configured for sub-agents.'

  return {
    ...tool,
    description:
      `${tool.description}\n\nSub-agent model policy: allowed modelIds are configured by the user. ` +
      `Recommended default: ${preferredLine}. If the user explicitly asks for a sub-agent model, set modelId to one of the allowed modelIds; otherwise omit modelId.`,
    inputSchema: {
      ...tool.inputSchema,
      properties: {
        ...(tool.inputSchema.properties ?? {}),
        modelId: {
          type: 'string',
          enum: config.allowedModelIds,
          description: modelDescription,
        },
      },
    },
  }
}

export const selectAllowedTools = async ({
  availableTools,
  allowedToolNames,
  jsSandboxSettings = {},
  settings,
}: {
  availableTools: ToolDefinition[]
  allowedToolNames?: string[]
  jsSandboxSettings?: JsSandboxSettings
  settings?: YoloSettings
}): Promise<{
  filteredTools: ToolDefinition[]
  hasTools: boolean
  hasMemoryTools: boolean
  requestTools: RequestTool[] | undefined
}> => {
  const normalizedAllowedToolNames = expandAllowedToolNames(allowedToolNames)

  const filteredTools = applyDynamicToolDescriptions(
    availableTools.filter((tool) =>
      isToolAllowed({
        toolName: tool.name,
        allowedToolNames: normalizedAllowedToolNames,
      }),
    ),
    { jsSandboxSettings, settings },
  )

  return {
    filteredTools,
    hasTools: filteredTools.length > 0,
    hasMemoryTools: filteredTools.some((tool) =>
      isMemoryToolAvailable(tool.name),
    ),
    requestTools: buildRequestTools(filteredTools),
  }
}
