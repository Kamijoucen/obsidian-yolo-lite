import type { Assistant } from '../../types/assistant.types'

export const resolveAssistantIncludeCurrentFileContent = (
  assistant: Assistant | null | undefined,
): boolean => assistant?.includeCurrentFileContent ?? true

export const resolveAssistantTimeContextEnabled = (
  assistant: Assistant | null | undefined,
): boolean => assistant?.timeContextEnabled ?? true
