import { ChatModel } from './types/chat-model.types'
import {
  LLMProvider,
  LLMProviderApiType,
  LLMProviderPresetType,
  getDefaultApiTypeForPresetType,
  getDefaultRequestTransportModeByPlatform,
} from './types/provider.types'

export const CHAT_VIEW_TYPE = 'yolo-chat-view'

// Empty-string sentinel; display layer localizes via getConversationDisplayTitle.
export const DEFAULT_UNTITLED_CONVERSATION_TITLE = ''

// Default model ids (with provider prefix)
export const DEFAULT_CHAT_MODEL_ID = 'openai/gpt-5'
export const DEFAULT_CHAT_TITLE_MODEL_ID = 'openai/gpt-4.1-mini'

// Recommended model ids (with provider prefix)
export const RECOMMENDED_MODELS_FOR_CHAT = ['openai/gpt-4.1']
export const RECOMMENDED_MODELS_FOR_CHAT_TITLE = ['openai/gpt-4.1-mini']

export const DEFAULT_CHAT_TITLE_PROMPT = {
  en: 'You are a title generator. Generate a concise conversation title based on the first user message. Output the title only.',
  zh: '你是一个标题生成器。请基于用户首条消息生成一个简洁的会话标题，直接输出标题本身。',
} as const

const REQUEST_TRANSPORT_MODE_SETTING = {
  label: 'Network request method',
  key: 'requestTransportMode',
  type: 'select' as const,
  required: false,
  options: {
    browser: 'Browser request',
    obsidian: 'Obsidian built-in request',
    node: 'Desktop direct connection',
  },
  description:
    'Choose how this provider sends network requests on this device. Desktop direct connection is recommended on desktop. On mobile, switch to Obsidian built-in request if browser requests fail.',
}

export const RESPONSE_STREAMING_MODE_SETTING = {
  label: 'Response streaming mode',
  key: 'responseStreamingMode',
  type: 'select' as const,
  required: false,
  options: {
    auto: 'Auto',
    streaming: 'Streaming',
    'non-streaming': 'Non-streaming',
  },
  description:
    'Control whether this provider uses streaming or non-streaming responses.',
}

export const PROVIDER_PRESET_INFO = {
  openai: {
    label: 'OpenAI',
    defaultProviderId: 'openai',
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  'chatgpt-oauth': {
    label: 'ChatGPT OAuth',
    defaultProviderId: 'chatgpt-oauth',
    requireApiKey: false,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  deepseek: {
    label: 'DeepSeek',
    defaultProviderId: 'deepseek',
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  moonshot: {
    label: 'Moonshot',
    defaultProviderId: null,
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  zhipu: {
    label: 'Zhipu',
    defaultProviderId: null,
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  doubao: {
    label: 'Doubao',
    defaultProviderId: null,
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  siliconflow: {
    label: 'SiliconFlow',
    defaultProviderId: null,
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  stepfun: {
    label: 'StepFun',
    defaultProviderId: null,
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  minimax: {
    label: 'MiniMax',
    defaultProviderId: null,
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  hunyuan: {
    label: 'Hunyuan',
    defaultProviderId: null,
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  xiaomimimo: {
    label: 'Xiaomi MiMo',
    defaultProviderId: 'xiaomimimo',
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
  'openai-compatible': {
    label: 'OpenAI Compatible',
    defaultProviderId: null, // no default provider for this type
    requireApiKey: false,
    requireBaseUrl: true,
    additionalSettings: [
      {
        label: 'No Stainless headers',
        key: 'noStainless',
        type: 'toggle',
        required: false,
        description:
          'Enable this if you encounter CORS errors related to Stainless headers (x-stainless-os, etc.)',
      },
      REQUEST_TRANSPORT_MODE_SETTING,
      RESPONSE_STREAMING_MODE_SETTING,
    ],
  },
} as const satisfies Record<
  LLMProviderPresetType,
  {
    label: string
    defaultProviderId: string | null
    requireApiKey: boolean
    requireBaseUrl: boolean
    additionalSettings: {
      label: string
      key: string
      type: 'text' | 'toggle' | 'select'
      options?: Record<string, string>
      placeholder?: string
      description?: string
      required?: boolean
    }[]
  }
>

export const PROVIDER_API_INFO: Record<
  LLMProviderApiType,
  {
    label: string
  }
> = {
  'openai-compatible': {
    label: 'OpenAI Compatible',
  },
  'openai-responses': {
    label: 'OpenAI Responses',
  },
}

const getDefaultProviderAdditionalSettings = (
  _presetType: LLMProviderPresetType,
): LLMProvider['additionalSettings'] => {
  return { requestTransportMode: getDefaultRequestTransportModeByPlatform() }
}

/**
 * Important
 * 1. Update the settings schema when adding a default provider.
 * 2. If there's same provider id in user's settings, it's data should be overwritten by default provider
 */
export const DEFAULT_PROVIDERS: readonly LLMProvider[] = [
  {
    presetType: 'openai',
    apiType: getDefaultApiTypeForPresetType('openai'),
    id: PROVIDER_PRESET_INFO.openai.defaultProviderId,
  },
  {
    presetType: 'chatgpt-oauth',
    apiType: getDefaultApiTypeForPresetType('chatgpt-oauth'),
    id: PROVIDER_PRESET_INFO['chatgpt-oauth'].defaultProviderId,
    additionalSettings: getDefaultProviderAdditionalSettings('chatgpt-oauth'),
  },
  {
    presetType: 'deepseek',
    apiType: getDefaultApiTypeForPresetType('deepseek'),
    id: PROVIDER_PRESET_INFO.deepseek.defaultProviderId,
  },
  {
    presetType: 'xiaomimimo',
    apiType: getDefaultApiTypeForPresetType('xiaomimimo'),
    id: PROVIDER_PRESET_INFO.xiaomimimo.defaultProviderId,
  },
]

/**
 * Important
 * 1. Update the settings schema when adding a default model.
 * 2. If there's same model id in user's settings, it's data should be overwritten by default model
 */
export const DEFAULT_CHAT_MODELS: readonly ChatModel[] = [
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-5',
    model: 'gpt-5',
    enable: true,
  },
  {
    providerId: PROVIDER_PRESET_INFO['chatgpt-oauth'].defaultProviderId,
    id: 'chatgpt-oauth/gpt-5.3-codex-spark',
    model: 'gpt-5.3-codex-spark',
    name: 'GPT-5.3 Codex Spark',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO['chatgpt-oauth'].defaultProviderId,
    id: 'chatgpt-oauth/gpt-5.4',
    model: 'gpt-5.4',
    name: 'GPT-5.4',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-5-mini',
    model: 'gpt-5-mini',
    enable: false,
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-5-nano',
    model: 'gpt-5-nano',
    enable: false,
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-4.1',
    model: 'gpt-4.1',
    enable: true,
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-4.1-mini',
    model: 'gpt-4.1-mini',
    enable: true,
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-4.1-nano',
    model: 'gpt-4.1-nano',
    enable: true,
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-4o',
    model: 'gpt-4o',
    enable: false,
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/gpt-4o-mini',
    model: 'gpt-4o-mini',
    enable: false,
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/o4-mini',
    model: 'o4-mini',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.openai.defaultProviderId,
    id: 'openai/o3',
    model: 'o3',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.deepseek.defaultProviderId,
    id: 'deepseek/deepseek-v4-flash',
    model: 'deepseek-v4-flash',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.deepseek.defaultProviderId,
    id: 'deepseek/deepseek-v4-pro',
    model: 'deepseek-v4-pro',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.xiaomimimo.defaultProviderId,
    id: 'xiaomimimo/mimo-v2.5-pro',
    model: 'mimo-v2.5-pro',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.xiaomimimo.defaultProviderId,
    id: 'xiaomimimo/mimo-v2.5',
    model: 'mimo-v2.5',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.xiaomimimo.defaultProviderId,
    id: 'xiaomimimo/mimo-v2-pro',
    model: 'mimo-v2-pro',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.xiaomimimo.defaultProviderId,
    id: 'xiaomimimo/mimo-v2-omni',
    model: 'mimo-v2-omni',
    enable: false,
    reasoningType: 'openai',
  },
  {
    providerId: PROVIDER_PRESET_INFO.xiaomimimo.defaultProviderId,
    id: 'xiaomimimo/mimo-v2-flash',
    model: 'mimo-v2-flash',
    enable: false,
    reasoningType: 'openai',
  },
]

// Pricing in dollars per million tokens
type ModelPricing = {
  input: number
  output: number
}

export const OPENAI_PRICES: Record<string, ModelPricing> = {
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  o3: { input: 10, output: 40 },
  o1: { input: 15, output: 60 },
  'o4-mini': { input: 1.1, output: 4.4 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o1-mini': { input: 1.1, output: 4.4 },
}
