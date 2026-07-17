import { LLMProvider } from '../../types/provider.types'

/**
 * Default base URL each preset would use when the user leaves the field empty.
 * The value here is the URL the user would naturally type into the form (i.e. without
 * any provider-specific suffix.
 */
const DEFAULT_BASE_URL_BY_PRESET: Partial<
  Record<LLMProvider['presetType'], string>
> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com',
  moonshot: 'https://api.moonshot.cn/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  doubao: 'https://ark.cn-beijing.volces.com/api/v3',
  siliconflow: 'https://api.siliconflow.cn/v1',
  stepfun: 'https://api.stepfun.com/v1',
  minimax: 'https://api.minimax.chat/v1',
  hunyuan: 'https://api.hunyuan.cloud.tencent.com/v1',
  xiaomimimo: 'https://api.xiaomimimo.com/v1',
}

export function getDefaultBaseUrlForPreset(
  presetType: LLMProvider['presetType'],
): string | undefined {
  return DEFAULT_BASE_URL_BY_PRESET[presetType]
}

export function resolveProviderBaseUrl(
  provider: Pick<
    LLMProvider,
    'presetType' | 'apiType' | 'baseUrl' | 'additionalSettings'
  >,
): string | undefined {
  const customBaseUrl = provider.baseUrl?.trim()
  if (customBaseUrl) {
    return customBaseUrl.replace(/\/+$/, '')
  }

  return DEFAULT_BASE_URL_BY_PRESET[provider.presetType]
}

export function resolveProviderDisplayBaseUrl(
  provider: Pick<
    LLMProvider,
    'presetType' | 'apiType' | 'baseUrl' | 'additionalSettings'
  >,
): string | undefined {
  return resolveProviderBaseUrl(provider)
}

function joinEndpoint(baseUrl: string, endpoint: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`
}

function resolveOpenAICompatibleRequestBaseUrl(
  provider: Pick<
    LLMProvider,
    'presetType' | 'apiType' | 'baseUrl' | 'additionalSettings'
  >,
): string | undefined {
  const baseUrl = resolveProviderBaseUrl(provider)
  if (!baseUrl) {
    return undefined
  }

  return baseUrl
}

export function resolveProviderPrimaryRequestUrl(
  provider: Pick<
    LLMProvider,
    'presetType' | 'apiType' | 'baseUrl' | 'additionalSettings'
  >,
): string | undefined {
  switch (provider.apiType) {
    case 'openai-compatible': {
      const baseUrl = resolveOpenAICompatibleRequestBaseUrl(provider)
      return baseUrl ? joinEndpoint(baseUrl, 'chat/completions') : undefined
    }
    case 'openai-responses': {
      const baseUrl = resolveProviderBaseUrl(provider)
      return baseUrl ? joinEndpoint(baseUrl, 'responses') : undefined
    }
  }
}
