import {
  getBuiltinToolNamespace,
  getLocalFileTools,
} from '../../../core/tools/localFileTools'
import { getToolName } from '../../../core/tools/tool-name-utils'
import type { AssistantToolPreference } from '../../../types/assistant.types'

function getKnownBuiltinToolNames(): Set<string> {
  return new Set(
    getLocalFileTools().map((tool) =>
      getToolName(getBuiltinToolNamespace(), tool.name),
    ),
  )
}

export function normalizeToolPreferencesForPersistence(
  toolPreferences: Record<string, AssistantToolPreference> | undefined,
): Record<string, AssistantToolPreference> {
  const knownBuiltinToolNames = getKnownBuiltinToolNames()
  const entries = Object.entries(toolPreferences ?? {}).filter(([toolName]) =>
    knownBuiltinToolNames.has(toolName),
  )

  return Object.fromEntries(entries)
}
