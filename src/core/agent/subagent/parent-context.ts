import type {
  AssistantToolPreference,
  AssistantWorkspaceScope,
} from '../../../types/assistant.types'
import type { ChatModel } from '../../../types/chat-model.types'
import type {
  LLMProvider,
  LLMProviderApiType,
} from '../../../types/provider.types'
import type { ReasoningLevel } from '../../../types/reasoning'
import type { RequestContextBuilder } from '../../../utils/chat/requestContextBuilder'
import type { BaseLLMProvider } from '../../llm/base'
import type { ToolManager } from '../../tools/toolManager'
import type { AgentRuntimeLoopConfig, AgentRuntimeRunInput } from '../types'

export type SubagentParentContext = {
  providerClient: BaseLLMProvider<LLMProvider>
  model: ChatModel
  apiType?: LLMProviderApiType | null
  conversationId: string
  allowedToolNames?: string[]
  toolPreferences?: Record<string, AssistantToolPreference>
  workspaceScope?: AssistantWorkspaceScope
  allowedSkillPaths?: string[]
  reasoningLevel?: ReasoningLevel
  requestParams?: AgentRuntimeRunInput['requestParams']
  loopConfig: AgentRuntimeLoopConfig
  requestContextBuilder: RequestContextBuilder
  toolManager: ToolManager
  assistantId?: string
  bypassToolApproval?: boolean
}

export function buildSubagentParentContext(
  input: AgentRuntimeRunInput,
  loopConfig: AgentRuntimeLoopConfig,
): SubagentParentContext {
  return {
    providerClient: input.providerClient,
    model: input.model,
    apiType: input.apiType,
    conversationId: input.conversationId,
    allowedToolNames: input.allowedToolNames,
    toolPreferences: input.toolPreferences,
    workspaceScope: input.workspaceScope,
    allowedSkillPaths: input.allowedSkillPaths,
    reasoningLevel: input.reasoningLevel,
    requestParams: input.requestParams,
    loopConfig,
    requestContextBuilder: input.requestContextBuilder,
    toolManager: input.toolManager,
    assistantId: input.assistantId,
    bypassToolApproval: input.bypassToolApproval,
  }
}
