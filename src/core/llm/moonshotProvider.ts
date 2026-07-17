import { LLMProvider } from '../../types/provider.types'

import { KimiMessageAdapter } from './kimiMessageAdapter'
import { OpenAICompatibleProvider } from './openaiCompatibleProvider'
import { ModelRequestPolicy } from './requestPolicy'

export class MoonshotProvider extends OpenAICompatibleProvider {
  constructor(
    provider: LLMProvider,
    options?: {
      requestPolicy?: ModelRequestPolicy
    },
  ) {
    super(provider, {
      ...options,
      adapter: new KimiMessageAdapter(),
    })
  }
}
