/**
 * Utility functions for handling model IDs with provider prefixes
 */

/**
 * Generate a model ID with provider prefix
 * @param providerId - The provider ID (e.g., 'openai', 'deepseek')
 * @param modelName - The model name (e.g., 'gpt-5-mini')
 * @returns The prefixed model ID (e.g., 'openai/gpt-5-mini')
 */
export function generateModelId(providerId: string, modelName: string): string {
  // If modelName already contains a slash, it might already be prefixed
  if (modelName.includes('/')) {
    return modelName
  }
  return `${providerId}/${modelName}`
}

/**
 * Parse a model ID to extract provider prefix and model name
 * @param modelId - The model ID (e.g., 'openai/gpt-5-mini' or 'gpt-4.1')
 * @returns Object containing providerId and modelName
 */
export function parseModelId(modelId: string): {
  providerId: string | null
  modelName: string
} {
  const parts = modelId.split('/')
  if (parts.length === 2) {
    return {
      providerId: parts[0],
      modelName: parts[1],
    }
  }
  // No prefix, return the whole ID as model name
  return {
    providerId: null,
    modelName: modelId,
  }
}

/**
 * Get display name for a model (without provider prefix)
 * @param modelId - The model ID
 * @returns The display name
 */
export function getModelDisplayName(modelId: string): string {
  const { modelName } = parseModelId(modelId)
  return modelName
}

/**
 * Detect reasoning type based on model id keywords.
 * Returns 'openai' for known OpenAI-style reasoning models; otherwise 'none'.
 */
export function detectReasoningTypeFromModelId(
  modelIdOrName: string,
): 'openai' | 'none' {
  const s = (modelIdOrName || '').toLowerCase()
  if (!s) return 'none'

  // Common OpenAI patterns: gpt*, o1/o3/o4 (including variants like o4mini), gpt5
  if (
    s.includes('gpt') ||
    s.includes('o1') ||
    s.includes('o3') ||
    s.includes('o4') ||
    s.includes('gpt5') ||
    s.includes('gpt-5')
  ) {
    return 'openai'
  }

  if (s.includes('deepseek-v4')) {
    return 'openai'
  }

  return 'none'
}

/**
 * Ensure a unique model internal id among existing ids by appending a short numeric suffix.
 * Example: base "openai/gpt-5" -> "openai/gpt-5-2", "...-3", ...
 */
export function ensureUniqueModelId(
  existingIds: string[],
  baseId: string,
): string {
  if (!existingIds.includes(baseId)) return baseId
  let i = 2
  while (existingIds.includes(`${baseId}-${i}`)) i++
  return `${baseId}-${i}`
}
