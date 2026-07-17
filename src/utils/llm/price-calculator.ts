import { OPENAI_PRICES } from '../../constants'
import { ChatModel } from '../../types/chat-model.types'
import { ResponseUsage } from '../../types/llm/response'

// Returns the cost in dollars. Returns null if the model is not supported.
export const calculateLLMCost = ({
  model,
  usage,
}: {
  model: ChatModel
  usage: ResponseUsage
}): number | null => {
  const providerKey = model.providerId.split('/')[0] ?? model.providerId

  switch (providerKey) {
    case 'openai': {
      const modelPricing = OPENAI_PRICES[model.model]
      if (!modelPricing) return null
      return (
        (usage.prompt_tokens * modelPricing.input +
          usage.completion_tokens * modelPricing.output) /
        1_000_000
      )
    }
    case 'chatgpt-oauth': {
      return 0
    }
    default:
      return null
  }
}
