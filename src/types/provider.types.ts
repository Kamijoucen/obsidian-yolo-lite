import { z } from 'zod'

const providerHeaderSchema = z.object({
  key: z
    .string({
      required_error: 'header key is required',
    })
    .min(1, 'header key is required'),
  value: z.string().default(''),
})

export const requestTransportModeSchema = z.enum([
  'browser',
  'obsidian',
  'node',
])

export const requestTransportModeByPlatformSchema = z.object({
  desktop: requestTransportModeSchema.optional(),
  mobile: z.enum(['browser', 'obsidian']).optional(),
})

export const responseStreamingModeSchema = z.enum([
  'auto',
  'streaming',
  'non-streaming',
])

export const providerPresetTypeSchema = z.enum([
  'openai',
  'chatgpt-oauth',
  'deepseek',
  'moonshot',
  'zhipu',
  'doubao',
  'siliconflow',
  'stepfun',
  'minimax',
  'hunyuan',
  'xiaomimimo',
  'openai-compatible',
])

export const providerApiTypeSchema = z.enum([
  'openai-compatible',
  'openai-responses',
])

export type LLMProviderPresetType = z.infer<typeof providerPresetTypeSchema>
export type LLMProviderApiType = z.infer<typeof providerApiTypeSchema>

export function getDefaultRequestTransportModeForPresetType(
  _presetType: LLMProviderPresetType,
  isDesktop: boolean,
): RequestTransportMode {
  return isDesktop ? 'node' : 'browser'
}

export function getDefaultRequestTransportModeByPlatform(): RequestTransportModeByPlatform {
  return {
    desktop: 'node',
    mobile: 'browser',
  }
}

const DEFAULT_PROVIDER_API_TYPE_BY_PRESET: Record<
  LLMProviderPresetType,
  LLMProviderApiType
> = {
  openai: 'openai-responses',
  'chatgpt-oauth': 'openai-responses',
  deepseek: 'openai-compatible',
  moonshot: 'openai-compatible',
  zhipu: 'openai-compatible',
  doubao: 'openai-compatible',
  siliconflow: 'openai-compatible',
  stepfun: 'openai-compatible',
  minimax: 'openai-compatible',
  hunyuan: 'openai-compatible',
  xiaomimimo: 'openai-compatible',
  'openai-compatible': 'openai-compatible',
}

export function getDefaultApiTypeForPresetType(
  presetType: LLMProviderPresetType,
): LLMProviderApiType {
  return DEFAULT_PROVIDER_API_TYPE_BY_PRESET[presetType]
}

export function getSupportedApiTypesForPresetType(
  presetType: LLMProviderPresetType,
): readonly LLMProviderApiType[] {
  if (presetType === 'openai' || presetType === 'openai-compatible') {
    return ['openai-responses', 'openai-compatible']
  }
  return [getDefaultApiTypeForPresetType(presetType)]
}

export const llmProviderSchema = z.object({
  id: z.string().min(1, 'id is required'),
  presetType: providerPresetTypeSchema,
  apiType: providerApiTypeSchema,
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  additionalSettings: z.record(z.string(), z.unknown()).optional(),
  customHeaders: z.array(providerHeaderSchema).optional(),
})

/**
 * When adding a new provider, make sure to update these files:
 * - src/constants.ts
 * - src/types/chat-model.types.ts
 * - src/core/llm/manager.ts
 */
export type LLMProvider = z.infer<typeof llmProviderSchema>
export type ProviderHeader = z.infer<typeof providerHeaderSchema>
export type RequestTransportMode = z.infer<typeof requestTransportModeSchema>
export type ResponseStreamingMode = z.infer<typeof responseStreamingModeSchema>
export type RequestTransportModeByPlatform = {
  desktop?: RequestTransportMode
  mobile?: Extract<RequestTransportMode, 'browser' | 'obsidian'>
}
