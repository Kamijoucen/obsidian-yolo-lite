import OpenAI from 'openai'

import { ChatModel } from '../../types/chat-model.types'
import {
  LLMOptions,
  LLMRequestNonStreaming,
  LLMRequestStreaming,
} from '../../types/llm/request'
import {
  LLMResponseNonStreaming,
  LLMResponseStreaming,
} from '../../types/llm/response'
import { LLMProvider, RequestTransportMode } from '../../types/provider.types'
import { resolveRequestReasoningLevel } from '../../types/reasoning'
import { getBuiltinProviderTools } from '../../utils/llm/model-tools'
import { resolveProviderBaseUrl } from '../../utils/llm/provider-base-url'
import { toProviderHeadersRecord } from '../../utils/llm/provider-headers'
import { formatMessages } from '../../utils/llm/request'

import { BaseLLMProvider } from './base'
import { resolveAdapterForBaseUrl } from './baseUrlDetection'
import { LLMBaseUrlNotSetException } from './exception'
import { NoStainlessOpenAI } from './NoStainlessOpenAI'
import { applyOpenAICompatibleCapabilities } from './openaiCompatibleCapabilities'
import { OpenAIMessageAdapter } from './openaiMessageAdapter'
import { ModelRequestPolicy, resolveSdkMaxRetries } from './requestPolicy'
import {
  resolveRequestTransportMode,
  runWithRequestTransport,
  runWithRequestTransportForStream,
} from './requestTransport'
import { createTransportClients } from './transportClients'

type OpenAICompatibleExtras = {
  reasoning?: Record<string, unknown>
  extra_body?: Record<string, unknown>
  plugins?: Record<string, unknown>[]
}

type OpenAICompatibleRequest = LLMRequestNonStreaming &
  Record<string, unknown> &
  OpenAICompatibleExtras
type OpenAICompatibleStreamingRequest = LLMRequestStreaming &
  Record<string, unknown> &
  OpenAICompatibleExtras

export class OpenAICompatibleProvider extends BaseLLMProvider<LLMProvider> {
  private adapter: OpenAIMessageAdapter
  private browserClient: OpenAI
  private obsidianClient: OpenAI
  private nodeClient: OpenAI
  private resolvedBaseUrl?: string
  private requestTransportMode: RequestTransportMode

  constructor(
    provider: LLMProvider,
    options?: {
      adapter?: OpenAIMessageAdapter
      requestPolicy?: ModelRequestPolicy
    },
  ) {
    super(provider)
    this.resolvedBaseUrl = resolveProviderBaseUrl(provider)
    this.adapter =
      options?.adapter ?? resolveAdapterForBaseUrl(this.resolvedBaseUrl)
    const defaultHeaders = toProviderHeadersRecord(provider.customHeaders)
    this.requestTransportMode = resolveRequestTransportMode({
      additionalSettings: provider.additionalSettings,
    })
    const ClientCtor = provider.additionalSettings?.noStainless
      ? NoStainlessOpenAI
      : OpenAI
    // Prefer standard OpenAI SDK; allow opting into NoStainless to bypass headers/validation when needed
    const clientOptions = {
      apiKey: provider.apiKey ?? '',
      baseURL: this.resolvedBaseUrl ?? '',
      dangerouslyAllowBrowser: true,
      maxRetries: resolveSdkMaxRetries({
        requestPolicy: options?.requestPolicy,
        requestTransportMode: this.requestTransportMode,
      }),
      timeout: options?.requestPolicy?.timeoutMs,
      defaultHeaders,
    }
    const clients = createTransportClients(
      (transportFetch) =>
        new ClientCtor({
          ...clientOptions,
          fetch: transportFetch,
        }),
    )
    this.browserClient = clients.browserClient
    this.obsidianClient = clients.obsidianClient
    this.nodeClient = clients.nodeClient
  }

  async generateResponse(
    model: ChatModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (!this.resolvedBaseUrl) {
      throw new LLMBaseUrlNotSetException(
        `Provider ${this.provider.id} base URL is missing. Please set it in settings menu.`,
      )
    }

    let formattedRequest: OpenAICompatibleRequest = {
      ...request,
      messages: formatMessages(request.messages),
    }

    this.applyBuiltinProviderTools(formattedRequest, model)

    applyOpenAICompatibleCapabilities({
      request: formattedRequest,
      reasoningType: model.reasoningType,
      reasoningLevel: resolveRequestReasoningLevel(
        model,
        request.reasoningLevel,
      ),
      baseUrl: this.resolvedBaseUrl,
    })

    formattedRequest = this.applyCustomModelParameters(model, formattedRequest)
    return runWithRequestTransport({
      mode: this.requestTransportMode,
      runBrowser: () =>
        this.adapter.generateResponse(
          this.browserClient,
          formattedRequest,
          options,
        ),
      runObsidian: () =>
        this.adapter.generateResponse(
          this.obsidianClient,
          formattedRequest,
          options,
        ),
      runNode: () =>
        this.adapter.generateResponse(
          this.nodeClient,
          formattedRequest,
          options,
        ),
    })
  }

  async streamResponse(
    model: ChatModel,
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (!this.resolvedBaseUrl) {
      throw new LLMBaseUrlNotSetException(
        `Provider ${this.provider.id} base URL is missing. Please set it in settings menu.`,
      )
    }

    let formattedRequest: OpenAICompatibleStreamingRequest = {
      ...request,
      messages: formatMessages(request.messages),
    }

    this.applyBuiltinProviderTools(formattedRequest, model)

    applyOpenAICompatibleCapabilities({
      request: formattedRequest,
      reasoningType: model.reasoningType,
      reasoningLevel: resolveRequestReasoningLevel(
        model,
        request.reasoningLevel,
      ),
      baseUrl: this.resolvedBaseUrl,
    })

    formattedRequest = this.applyCustomModelParameters(model, formattedRequest)
    return runWithRequestTransportForStream({
      mode: this.requestTransportMode,
      signal: options?.signal,
      createBrowserStream: (signal) =>
        this.adapter.streamResponse(this.browserClient, formattedRequest, {
          ...options,
          signal: signal ?? options?.signal,
        }),
      createObsidianStream: (signal) =>
        this.adapter.streamResponse(this.obsidianClient, formattedRequest, {
          ...options,
          signal: signal ?? options?.signal,
        }),
      createNodeStream: (signal) =>
        this.adapter.streamResponse(this.nodeClient, formattedRequest, {
          ...options,
          signal: signal ?? options?.signal,
        }),
    })
  }

  /**
   * Model-level OpenAI-compatible hosted web search.
   *
   * - `web_search` → `extra_body.tools=[{type:'web_search'}]` (OpenAI Chat
   *   Completions hosted web search for gateways that support it.
   */
  private applyBuiltinProviderTools(
    formattedRequest:
      | OpenAICompatibleRequest
      | OpenAICompatibleStreamingRequest,
    model: ChatModel,
  ) {
    if (
      !getBuiltinProviderTools(model).some((tool) => tool.type === 'web_search')
    ) {
      return
    }
    const existing = Array.isArray(formattedRequest.extra_body?.tools)
      ? (formattedRequest.extra_body.tools as unknown[])
      : []
    formattedRequest.extra_body = {
      ...(formattedRequest.extra_body ?? {}),
      tools: [...existing, { type: 'web_search' }],
    }
  }
}
