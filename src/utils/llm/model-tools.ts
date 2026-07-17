import { ChatModel } from '../../types/chat-model.types'

/**
 * Provider built-in (hosted / server-side) tools. These are executed on the
 * model provider's side and share the same request payload as function-calling
 * tools — but use provider-specific shapes. We carry them through the pipeline
 * as a small internal tagged union; each provider client picks out the family
 * it knows how to forward and ignores the rest.
 *
 * - `web_search`: OpenAI-style hosted web search. OpenAI-compatible gateways
 *   forward as `extra_body.tools=[{type:"web_search"}]`; OpenAI Responses maps
 *   to `tools=[{type:"web_search_preview"}]`.
 */
export type BuiltinProviderTool = { type: 'web_search' }

export function getBuiltinProviderTools(
  model: Pick<ChatModel, 'builtinToolProvider' | 'builtinTools'>,
): BuiltinProviderTool[] {
  switch (model.builtinToolProvider) {
    case 'gpt': {
      if (model.builtinTools?.gpt?.webSearch?.enabled) {
        return [{ type: 'web_search' }]
      }
      return []
    }
    default:
      return []
  }
}
