import { DEFAULT_SYSTEM_PROMPT } from '../../core/acp/agentsMd'

export type ChatMode = 'plan' | 'build'

export type YoloSettings = {
  opencodePath: string
  opencodeArgs: string[]
  defaultMode: ChatMode
  autoApprovePermissions: boolean
  showReasoning: boolean
  debugLog: boolean
  systemPrompt: string
  manageAgentsMd: boolean
}

export const DEFAULT_SETTINGS: YoloSettings = {
  opencodePath: '',
  opencodeArgs: [],
  defaultMode: 'build',
  autoApprovePermissions: false,
  showReasoning: true,
  debugLog: false,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  manageAgentsMd: true,
}

export function normalizeSettings(raw: unknown): YoloSettings {
  const source =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {}
  return {
    opencodePath:
      typeof source.opencodePath === 'string'
        ? source.opencodePath
        : DEFAULT_SETTINGS.opencodePath,
    opencodeArgs: Array.isArray(source.opencodeArgs)
      ? source.opencodeArgs.filter(
          (item): item is string => typeof item === 'string',
        )
      : DEFAULT_SETTINGS.opencodeArgs,
    defaultMode:
      source.defaultMode === 'plan' || source.defaultMode === 'build'
        ? source.defaultMode
        : DEFAULT_SETTINGS.defaultMode,
    autoApprovePermissions:
      typeof source.autoApprovePermissions === 'boolean'
        ? source.autoApprovePermissions
        : DEFAULT_SETTINGS.autoApprovePermissions,
    showReasoning:
      typeof source.showReasoning === 'boolean'
        ? source.showReasoning
        : DEFAULT_SETTINGS.showReasoning,
    debugLog:
      typeof source.debugLog === 'boolean'
        ? source.debugLog
        : DEFAULT_SETTINGS.debugLog,
    systemPrompt:
      typeof source.systemPrompt === 'string' && source.systemPrompt.trim()
        ? source.systemPrompt
        : DEFAULT_SETTINGS.systemPrompt,
    manageAgentsMd:
      typeof source.manageAgentsMd === 'boolean'
        ? source.manageAgentsMd
        : DEFAULT_SETTINGS.manageAgentsMd,
  }
}
