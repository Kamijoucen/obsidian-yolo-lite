import { Platform } from 'obsidian'
import { v4 as uuidv4 } from 'uuid'

import {
  AssistantToolPreference,
  AssistantWorkspaceScope,
} from '../../types/assistant.types'
import { ChatMessage, ChatToolMessage } from '../../types/chat'
import {
  ToolCallRequest,
  ToolCallResponse,
  ToolCallResponseStatus,
  createPartialToolCallArguments,
  getToolCallArgumentsObject,
  getToolCallArgumentsText,
} from '../../types/tool-call.types'
import {
  parseAndRepairToolArguments,
  parseAndRepairToolArgumentsText,
} from '../../utils/chat/tool-argument-parser'
import { captureLLMDebugOperation } from '../llm/debugCapture'
import {
  ASK_USER_QUESTION_TOOL_NAME,
  TERMINAL_COMMAND_TOOL_NAME,
  getBuiltinToolNamespace,
  isAskUserQuestionToolName,
  isLocalFsWriteToolName,
  validateAskUserQuestionArgs,
} from '../tools/localFileTools'
import { parseToolName } from '../tools/tool-name-utils'
import { ToolManager } from '../tools/toolManager'

import {
  DEFAULT_BLOCKED_PREFIXES,
  classifyBashCommandSafety,
  isBlockedByCommandPrefix,
} from './bash/command-classifier'
import type { SubagentParentContext } from './subagent/parent-context'
import { isSubagentBlockedToolName } from './subagent/tool-filter'
import {
  getAssistantToolApprovalMode,
  isAssistantToolEnabled,
} from './tool-preferences'
import { expandAllowedToolNames } from './tool-selection'
import {
  buildAllowedSkillPathSet,
  findPathOutsideScope,
} from './workspaceScope'

type BuiltinToolCallParams = Parameters<ToolManager['callTool']>[0]
type BuiltinToolCallParamsWithDebug = BuiltinToolCallParams & {
  debugTraceId?: string
}

const getTypeName = (value: unknown): string => {
  if (Array.isArray(value)) return 'array'
  return typeof value
}

const requireStringField = ({
  args,
  field,
  errors,
}: {
  args: Record<string, unknown>
  field: string
  errors: string[]
}): void => {
  if (typeof args[field] !== 'string') {
    errors.push(
      `${field} must be a string; received ${getTypeName(args[field])}.`,
    )
  }
}

const requireIntegerField = ({
  args,
  field,
  errors,
}: {
  args: Record<string, unknown>
  field: string
  errors: string[]
}): void => {
  if (typeof args[field] !== 'number' || !Number.isInteger(args[field])) {
    errors.push(
      `${field} must be an integer; received ${getTypeName(args[field])}.`,
    )
  }
}

const validateLocalWriteArgs = ({
  toolName,
  args,
}: {
  toolName: string
  args: Record<string, unknown>
}): string[] => {
  const errors: string[] = []

  switch (toolName) {
    case 'fs_write':
      requireStringField({ args, field: 'path', errors })
      requireStringField({ args, field: 'content', errors })
      break
    case 'fs_edit': {
      requireStringField({ args, field: 'path', errors })
      requireStringField({ args, field: 'newText', errors })
      const hasOldText = typeof args.oldText === 'string'
      const hasStartLine = args.startLine !== undefined
      const hasEndLine = args.endLine !== undefined
      if (hasOldText && (hasStartLine || hasEndLine)) {
        errors.push(
          'Use exactly one edit locator: oldText, or startLine with endLine; do not combine them.',
        )
      } else if (!hasOldText) {
        requireIntegerField({ args, field: 'startLine', errors })
        requireIntegerField({ args, field: 'endLine', errors })
      }
      break
    }
    case 'fs_delete':
    case 'fs_create_dir':
      requireStringField({ args, field: 'path', errors })
      break
    case 'fs_move':
      requireStringField({ args, field: 'oldPath', errors })
      requireStringField({ args, field: 'newPath', errors })
      break
  }

  return errors
}

const getRequiredLocalWriteArgumentNames = (toolName: string): string[] => {
  switch (toolName) {
    case 'fs_write':
      return ['path', 'content']
    case 'fs_edit':
      return ['path', 'newText', 'oldText or startLine/endLine']
    case 'fs_delete':
    case 'fs_create_dir':
      return ['path']
    case 'fs_move':
      return ['oldPath', 'newPath']
    default:
      return []
  }
}

const getToolCallDiagnostics = (request: ToolCallRequest) =>
  request.metadata?.argumentDiagnostics

const getLocalWriteToolShortName = (toolCallName: string): string | null => {
  try {
    const parsed = parseToolName(toolCallName)
    if (parsed.namespace !== getBuiltinToolNamespace()) return null
    return isLocalFsWriteToolName(parsed.toolName) ? parsed.toolName : null
  } catch {
    return null
  }
}

const hasUnsafeStringCompletionRepair = (repairActions: string[]): boolean => {
  return repairActions.includes('closed unterminated string')
}

const formatToolArgumentDiagnostics = ({
  request,
  title,
  parseError,
  providedParameterNames,
  requiredParameterNames,
  validationErrors,
  repairActions,
}: {
  request: ToolCallRequest
  title: string
  parseError?: string
  providedParameterNames?: string[]
  requiredParameterNames?: string[]
  validationErrors?: string[]
  repairActions?: string[]
}): string => {
  const diagnostics = getToolCallDiagnostics(request)
  const rawArguments = getToolCallArgumentsText(request.arguments) ?? ''
  const rawArgsLength = diagnostics?.rawArgsLength ?? rawArguments.length
  const rawArgsHead =
    (diagnostics?.rawArgsHead ?? rawArguments.slice(0, 240)) || '<empty>'
  const providedNames =
    providedParameterNames && providedParameterNames.length > 0
      ? providedParameterNames
      : getToolCallArgumentsObject(request.arguments)
        ? Object.keys(
            getToolCallArgumentsObject(request.arguments) ?? {},
          ).sort()
        : []
  const requiredNames = requiredParameterNames ?? []
  const repairSummary = repairActions?.length
    ? repairActions.join('; ')
    : diagnostics?.repairActions?.length
      ? diagnostics.repairActions.join('; ')
      : diagnostics?.repairApplied
        ? 'repair applied'
        : 'none'

  return [
    `${title}: "${request.name}" arguments are not executable.`,
    ...(parseError ? [`Parse error: ${parseError}`] : []),
    ...(validationErrors?.length
      ? ['Validation errors:', ...validationErrors.map((error) => `- ${error}`)]
      : []),
    `Provided parameter names: ${providedNames.length > 0 ? providedNames.join(', ') : '<none>'}.`,
    `Required parameter names: ${requiredNames.length > 0 ? requiredNames.join(', ') : '<unknown>'}.`,
    `Raw args length: ${rawArgsLength}.`,
    `Raw args head: ${rawArgsHead}`,
    `finishReason: ${diagnostics?.finishReason ?? '<unknown>'}.`,
    `streamState: ${diagnostics?.streamState ?? '<unknown>'}; parseState: ${diagnostics?.parseState ?? '<unknown>'}; sealReason: ${diagnostics?.sealReason ?? '<unknown>'}.`,
    `repair: ${repairSummary}.`,
    'Retry by calling the tool again with a smaller, complete JSON object. Do not include huge file contents in one tool call when a narrower edit is possible.',
  ].join('\n')
}

export class AgentToolGateway {
  private readonly toolsEnabled: boolean
  private readonly allowedToolNames?: Set<string>
  private readonly toolPreferences?: Record<string, AssistantToolPreference>
  private readonly workspaceScope?: AssistantWorkspaceScope
  private readonly allowedSkillPaths?: readonly string[]
  private readonly subagentParentContext?: SubagentParentContext
  private readonly isSubagentChildRun: boolean
  private readonly toolApprovalConversationId?: string
  private readonly blockedCommandPrefixes: readonly string[] | null
  private readonly bypassToolApproval: boolean

  constructor(
    private readonly toolManager: ToolManager,
    options?: {
      toolsEnabled?: boolean
      allowedToolNames?: string[]
      toolPreferences?: Record<string, AssistantToolPreference>
      workspaceScope?: AssistantWorkspaceScope
      allowedSkillPaths?: string[]
      subagentParentContext?: SubagentParentContext
      isSubagentChildRun?: boolean
      toolApprovalConversationId?: string
      blockedCommandPrefixes?: string[]
      bypassToolApproval?: boolean
    },
  ) {
    this.toolsEnabled = options?.toolsEnabled ?? true
    this.allowedToolNames = options?.allowedToolNames
      ? expandAllowedToolNames(options.allowedToolNames)
      : undefined
    this.toolPreferences = options?.toolPreferences
    this.workspaceScope = options?.workspaceScope
    this.allowedSkillPaths = options?.allowedSkillPaths
    this.subagentParentContext = options?.subagentParentContext
    this.isSubagentChildRun = options?.isSubagentChildRun ?? false
    this.toolApprovalConversationId = options?.toolApprovalConversationId
    this.blockedCommandPrefixes = options?.blockedCommandPrefixes ?? null
    this.bypassToolApproval = options?.bypassToolApproval ?? false
  }

  private findRequestPathOutsideScope(request: ToolCallRequest): string | null {
    if (!this.workspaceScope?.enabled) return null
    try {
      const parsed = parseToolName(request.name)
      if (parsed.namespace !== getBuiltinToolNamespace()) return null
      const args = getToolCallArgumentsObject(request.arguments)
      return findPathOutsideScope(parsed.toolName, args, this.workspaceScope, {
        exemptPaths: this.allowedSkillPaths
          ? buildAllowedSkillPathSet(this.allowedSkillPaths)
          : undefined,
      })
    } catch {
      return null
    }
  }

  private prepareFinalToolCallRequest(
    request: ToolCallRequest,
  ):
    | { ok: true; request: ToolCallRequest }
    | { ok: false; request: ToolCallRequest; response: ToolCallResponse } {
    if (!request.arguments || request.arguments.kind === 'complete') {
      return { ok: true, request }
    }

    const parsed = parseAndRepairToolArguments(request.arguments)
    const localWriteToolName = getLocalWriteToolShortName(request.name)
    if (!parsed.ok) {
      return {
        ok: false,
        request,
        response: {
          status: ToolCallResponseStatus.Error,
          error: formatToolArgumentDiagnostics({
            request,
            title: 'Tool argument parsing failed',
            parseError: parsed.error,
            providedParameterNames: parsed.providedParameterNames,
            requiredParameterNames: localWriteToolName
              ? getRequiredLocalWriteArgumentNames(localWriteToolName)
              : undefined,
            repairActions: parsed.repairActions,
          }),
        },
      }
    }

    if (
      localWriteToolName &&
      parsed.repairApplied &&
      hasUnsafeStringCompletionRepair(parsed.repairActions)
    ) {
      return {
        ok: false,
        request,
        response: {
          status: ToolCallResponseStatus.Error,
          error: formatToolArgumentDiagnostics({
            request,
            title: 'Tool argument parsing failed',
            parseError:
              'Repair would close an unterminated string in a local write tool. This likely means file content was truncated, so the tool was not executed.',
            providedParameterNames: Object.keys(parsed.value).sort(),
            requiredParameterNames:
              getRequiredLocalWriteArgumentNames(localWriteToolName),
            repairActions: parsed.repairActions,
          }),
        },
      }
    }

    return {
      ok: true,
      request: {
        ...request,
        arguments: parsed.arguments,
        metadata: {
          ...request.metadata,
          argumentDiagnostics: {
            ...request.metadata?.argumentDiagnostics,
            parseState: parsed.repairApplied ? 'repaired' : 'valid',
            rawArgsLength:
              request.metadata?.argumentDiagnostics?.rawArgsLength ??
              getToolCallArgumentsText(request.arguments)?.length ??
              0,
            rawArgsHead:
              request.metadata?.argumentDiagnostics?.rawArgsHead ??
              getToolCallArgumentsText(request.arguments)?.slice(0, 240) ??
              '',
            repairApplied: parsed.repairApplied,
            repairActions: parsed.repairActions,
          },
        },
      },
    }
  }

  private getLocalWriteArgumentError(request: ToolCallRequest): string | null {
    const localWriteToolName = getLocalWriteToolShortName(request.name)
    if (!localWriteToolName) return null
    const toolName = localWriteToolName

    if (!request.arguments) {
      return formatToolArgumentDiagnostics({
        request: {
          ...request,
          arguments: createPartialToolCallArguments(''),
        },
        title: 'Tool argument parsing failed',
        parseError: 'Missing arguments. Expected a JSON object.',
        requiredParameterNames: getRequiredLocalWriteArgumentNames(toolName),
      })
    }

    if (request.arguments.kind === 'partial') {
      const parsed = parseAndRepairToolArgumentsText(request.arguments.rawText)
      return formatToolArgumentDiagnostics({
        request,
        title: 'Tool argument parsing failed',
        parseError: parsed.ok
          ? 'Arguments were still marked partial after parsing.'
          : parsed.error,
        providedParameterNames: parsed.ok
          ? Object.keys(parsed.value).sort()
          : parsed.providedParameterNames,
        requiredParameterNames: getRequiredLocalWriteArgumentNames(toolName),
        repairActions: parsed.repairActions,
      })
    }

    const validationErrors = validateLocalWriteArgs({
      toolName,
      args: request.arguments.value,
    })
    if (validationErrors.length === 0) {
      return null
    }

    return formatToolArgumentDiagnostics({
      request,
      title: 'Tool argument validation failed',
      providedParameterNames: Object.keys(request.arguments.value).sort(),
      requiredParameterNames: getRequiredLocalWriteArgumentNames(toolName),
      validationErrors,
    })
  }

  createToolMessage({
    toolCallRequests,
    conversationId,
    branchId,
    sourceUserMessageId,
    branchModelId,
    branchLabel,
  }: {
    toolCallRequests: ToolCallRequest[]
    conversationId: string
    branchId?: string
    sourceUserMessageId?: string
    branchModelId?: string
    branchLabel?: string
  }): ChatToolMessage {
    const preparedRequests = toolCallRequests.map((request) =>
      this.prepareFinalToolCallRequest(request),
    )
    const normalizedToolCallRequests = preparedRequests.map(
      (prepared) => prepared.request,
    )
    // ask_user_question is exclusive within a single LLM turn. Detect this
    // up-front so we can force all sibling outcomes accordingly before falling
    // back to the per-tool routing for non-ask cases.
    const askIndices: number[] = []
    normalizedToolCallRequests.forEach((request, index) => {
      if (isAskUserQuestionToolName(request.name)) {
        askIndices.push(index)
      }
    })
    const hasAsk = askIndices.length > 0
    const firstAskIndex = hasAsk ? askIndices[0] : -1

    return {
      role: 'tool',
      id: uuidv4(),
      metadata: {
        branchConversationId: conversationId,
        branchId,
        sourceUserMessageId,
        branchModelId,
        branchLabel,
      },
      toolCalls: preparedRequests.map((prepared, index) => {
        const request = prepared.request
        return {
          request,
          response:
            prepared.ok === false
              ? prepared.response
              : this.resolveInitialResponse({
                  request,
                  conversationId,
                  isAskRequest:
                    hasAsk && index === firstAskIndex
                      ? 'primary-ask'
                      : hasAsk && askIndices.includes(index)
                        ? 'duplicate-ask'
                        : hasAsk
                          ? 'ask-sibling'
                          : 'normal',
                }),
        }
      }),
    }
  }

  private resolveInitialResponse({
    request,
    conversationId,
    isAskRequest,
  }: {
    request: ToolCallRequest
    conversationId: string
    isAskRequest: 'primary-ask' | 'duplicate-ask' | 'ask-sibling' | 'normal'
  }): ToolCallResponse {
    if (isAskRequest === 'duplicate-ask') {
      return {
        status: ToolCallResponseStatus.Error,
        error: `Only one ${ASK_USER_QUESTION_TOOL_NAME} call is allowed per turn.`,
      }
    }
    if (isAskRequest === 'ask-sibling') {
      return {
        status: ToolCallResponseStatus.Error,
        error: `This tool call cannot run alongside ${ASK_USER_QUESTION_TOOL_NAME} in the same turn.`,
      }
    }

    if (!this.isToolAllowed(request.name)) {
      return {
        status: ToolCallResponseStatus.Rejected,
        reason: `Tool "${request.name}" is not available in this workspace.`,
      }
    }

    const pathOutsideScope = this.findRequestPathOutsideScope(request)
    if (pathOutsideScope !== null) {
      return {
        status: ToolCallResponseStatus.Rejected,
        reason: `Path "${pathOutsideScope}" is outside this agent's workspace scope. Do not attempt to bypass this restriction. If the task requires this path, tell the user that it is outside the configured workspace scope.`,
      }
    }

    const localWriteArgumentError = this.getLocalWriteArgumentError(request)
    if (localWriteArgumentError) {
      return {
        status: ToolCallResponseStatus.Error,
        error: localWriteArgumentError,
      }
    }

    if (
      this.isBlockedTerminalCommand(
        getToolCallArgumentsObject(request.arguments),
        request.name,
      )
    ) {
      return {
        status: ToolCallResponseStatus.Error,
        error:
          'Terminal command rejected because it matches a blocked command prefix.',
      }
    }

    if (isAskRequest === 'primary-ask') {
      const validation = validateAskUserQuestionArgs(
        getToolCallArgumentsObject(request.arguments) ?? {},
      )
      if (!validation.ok) {
        return {
          status: ToolCallResponseStatus.Error,
          error: `ask_user_question schema validation failed: ${validation.error}`,
        }
      }
      return { status: ToolCallResponseStatus.AwaitingUserInput }
    }

    if (this.shouldAutoExecuteTool({ request, conversationId })) {
      return { status: ToolCallResponseStatus.Running }
    }

    return this.shouldUseFsEditReview(request.name)
      ? { status: ToolCallResponseStatus.Running }
      : { status: ToolCallResponseStatus.PendingApproval }
  }

  async executeAutoToolCalls({
    toolMessage,
    conversationId,
    conversationMessages,
    signal,
    chatModelId,
    debugTraceId,
  }: {
    toolMessage: ChatToolMessage
    conversationId: string
    conversationMessages?: ChatMessage[]
    signal?: AbortSignal
    chatModelId?: string
    debugTraceId?: string
  }): Promise<ChatToolMessage> {
    const nextToolCalls = [...toolMessage.toolCalls]
    for (let i = 0; i < nextToolCalls.length; i += 1) {
      const entry = nextToolCalls[i]
      if (entry.response.status !== ToolCallResponseStatus.Running) {
        continue
      }
      if (
        this.isBlockedTerminalCommand(
          getToolCallArgumentsObject(entry.request.arguments),
          entry.request.name,
        )
      ) {
        nextToolCalls[i] = {
          ...entry,
          response: {
            status: ToolCallResponseStatus.Error,
            error:
              'Terminal command rejected because it matches a blocked command prefix.',
          },
        }
        continue
      }
    }
    // `AwaitingUserInput` is intentionally excluded here: it is a paused state
    // (only used by `ask_user_question`) and must not be auto-executed. The
    // gateway resumes it via `AgentService.answerUserQuestion` instead.
    const runnableEntries = nextToolCalls
      .map((toolCall, index) => ({ index, toolCall }))
      .filter(
        ({ toolCall }) =>
          toolCall.response.status === ToolCallResponseStatus.Running,
      )

    // Group sibling fs_edit calls targeting the same file so their operations
    // can be applied atomically against a single snapshot (one unified review,
    // one write). This prevents the "approve one, others fail" class of bugs
    // where later edits were computed against stale line numbers / text that
    // an earlier sibling has since modified.
    type RunnableEntry = (typeof runnableEntries)[number]
    const fsEditGroups = new Map<string, RunnableEntry[]>()
    const standalone: RunnableEntry[] = []
    const terminalCommandLanes = new Map<string, RunnableEntry[]>()
    for (const entry of runnableEntries) {
      const path = this.getFsEditTargetPath(entry.toolCall.request)
      if (path === undefined) {
        standalone.push(entry)
        continue
      }
      const bucket = fsEditGroups.get(path)
      if (bucket) {
        bucket.push(entry)
      } else {
        fsEditGroups.set(path, [entry])
      }
    }

    type BatchOutcome = {
      entries: RunnableEntry[]
      responses: ToolCallResponse[]
    }

    const batchPromises: Promise<BatchOutcome>[] = []

    for (const entry of standalone) {
      const terminalLane = this.getTerminalCommandLane(entry.toolCall.request)
      if (terminalLane !== undefined) {
        const laneEntries = terminalCommandLanes.get(terminalLane)
        if (laneEntries) {
          laneEntries.push(entry)
        } else {
          terminalCommandLanes.set(terminalLane, [entry])
        }
        continue
      }

      batchPromises.push(
        this.callToolWithDebug({
          name: entry.toolCall.request.name,
          args: getToolCallArgumentsObject(entry.toolCall.request.arguments),
          id: entry.toolCall.request.id,
          conversationId,
          conversationMessages,
          roundId: toolMessage.id,
          requireReview: this.shouldUseFsEditReview(
            entry.toolCall.request.name,
          ),
          signal,
          chatModelId,
          debugTraceId,
          workspaceScope: this.workspaceScope,
          allowedSkillPaths: this.allowedSkillPaths,
          subagentParentContext: this.subagentParentContext,
        }).then((response) => ({ entries: [entry], responses: [response] })),
      )
    }

    for (const entries of terminalCommandLanes.values()) {
      batchPromises.push(
        this.callTerminalCommandLane({
          entries,
          conversationId,
          conversationMessages,
          roundId: toolMessage.id,
          signal,
          chatModelId,
          debugTraceId,
        }),
      )
    }

    for (const [path, entries] of fsEditGroups) {
      if (entries.length === 1) {
        const entry = entries[0]
        batchPromises.push(
          this.callToolWithDebug({
            name: entry.toolCall.request.name,
            args: getToolCallArgumentsObject(entry.toolCall.request.arguments),
            id: entry.toolCall.request.id,
            conversationId,
            conversationMessages,
            roundId: toolMessage.id,
            requireReview: this.shouldUseFsEditReview(
              entry.toolCall.request.name,
            ),
            signal,
            chatModelId,
            debugTraceId,
            workspaceScope: this.workspaceScope,
            allowedSkillPaths: this.allowedSkillPaths,
            subagentParentContext: this.subagentParentContext,
          }).then((response) => ({ entries: [entry], responses: [response] })),
        )
        continue
      }

      const { mergedOperations, opCounts } =
        this.collectFsEditOperations(entries)
      const leader = entries[0]
      const mergedArgs: Record<string, unknown> = {
        path,
        operations: mergedOperations,
      }

      batchPromises.push(
        this.callToolWithDebug({
          name: leader.toolCall.request.name,
          args: mergedArgs,
          id: leader.toolCall.request.id,
          conversationId,
          conversationMessages,
          roundId: toolMessage.id,
          requireReview: this.shouldUseFsEditReview(
            leader.toolCall.request.name,
          ),
          signal,
          chatModelId,
          debugTraceId,
          workspaceScope: this.workspaceScope,
          allowedSkillPaths: this.allowedSkillPaths,
          subagentParentContext: this.subagentParentContext,
        }).then((response) => ({
          entries,
          responses: this.splitBatchedFsEditResponse({
            response,
            opCounts,
            path,
          }),
        })),
      )
    }

    const results = await Promise.allSettled(batchPromises)

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { entries, responses } = result.value
        entries.forEach((entry, idx) => {
          nextToolCalls[entry.index] = {
            ...nextToolCalls[entry.index],
            response: responses[idx],
          }
        })
        return
      }

      // On rejection we don't have `entries` on the rejected promise; fall
      // back to iterating all runnable entries whose response is still
      // Running and marking the first contiguous group as errored. To stay
      // robust, set every still-Running entry to Error with the rejection
      // reason — this matches the previous behavior for parallel failures
      // and is safe because only failed batches reach here.
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
      runnableEntries.forEach((entry) => {
        if (
          nextToolCalls[entry.index].response.status ===
          ToolCallResponseStatus.Running
        ) {
          nextToolCalls[entry.index] = {
            ...nextToolCalls[entry.index],
            response: {
              status: ToolCallResponseStatus.Error,
              error: message,
            },
          }
        }
      })
    })

    return {
      ...toolMessage,
      toolCalls: nextToolCalls,
    }
  }

  private getTerminalCommandLane(request: ToolCallRequest): string | undefined {
    try {
      const parsed = parseToolName(request.name)
      if (
        parsed.namespace !== getBuiltinToolNamespace() ||
        parsed.toolName !== TERMINAL_COMMAND_TOOL_NAME
      ) {
        return undefined
      }
    } catch {
      return undefined
    }

    const args = getToolCallArgumentsObject(request.arguments)
    const sessionId = args?.session_id
    if (
      typeof sessionId === 'number' &&
      Number.isInteger(sessionId) &&
      sessionId > 0
    ) {
      return `session:${sessionId}`
    }

    return args?.background === true ? undefined : 'shared'
  }

  private async callTerminalCommandLane<
    TEntry extends { toolCall: { request: ToolCallRequest } },
  >({
    entries,
    conversationId,
    conversationMessages,
    roundId,
    signal,
    chatModelId,
    debugTraceId,
  }: {
    entries: TEntry[]
    conversationId: string
    conversationMessages?: ChatMessage[]
    roundId: string
    signal?: AbortSignal
    chatModelId?: string
    debugTraceId?: string
  }): Promise<{
    entries: TEntry[]
    responses: ToolCallResponse[]
  }> {
    const responses: ToolCallResponse[] = []
    for (const entry of entries) {
      try {
        responses.push(
          await this.callToolWithDebug({
            name: entry.toolCall.request.name,
            args: getToolCallArgumentsObject(entry.toolCall.request.arguments),
            id: entry.toolCall.request.id,
            conversationId,
            conversationMessages,
            roundId,
            requireReview: false,
            signal,
            chatModelId,
            debugTraceId,
            workspaceScope: this.workspaceScope,
            allowedSkillPaths: this.allowedSkillPaths,
            subagentParentContext: this.subagentParentContext,
          }),
        )
      } catch (error) {
        responses.push({
          status: ToolCallResponseStatus.Error,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return { entries, responses }
  }

  private async callToolWithDebug(
    params: BuiltinToolCallParamsWithDebug,
  ): Promise<ToolCallResponse> {
    const { debugTraceId, ...toolParams } = params
    return captureLLMDebugOperation({
      traceId: debugTraceId,
      signal: toolParams.signal,
      transportMode: 'internal-tool',
      url: `tool://${toolParams.name}`,
      method: 'callTool',
      requestBody: {
        name: toolParams.name,
        args: toolParams.args,
        id: toolParams.id,
        conversationId: toolParams.conversationId,
        roundId: toolParams.roundId,
        requireReview: toolParams.requireReview,
        chatModelId: toolParams.chatModelId,
      },
      responseContentType: 'application/json',
      run: () => this.toolManager.callTool(toolParams),
      getResponseBody: (response) => response,
    })
  }

  private getFsEditTargetPath(request: ToolCallRequest): string | undefined {
    try {
      const parsed = parseToolName(request.name)
      if (
        parsed.namespace !== getBuiltinToolNamespace() ||
        parsed.toolName !== 'fs_edit'
      ) {
        return undefined
      }
      const args = getToolCallArgumentsObject(request.arguments)
      const rawPath = args?.path
      if (typeof rawPath !== 'string') {
        return undefined
      }
      const trimmed = rawPath.trim()
      return trimmed === '' ? undefined : trimmed
    } catch {
      return undefined
    }
  }

  private collectFsEditOperations(
    entries: Array<{ toolCall: { request: ToolCallRequest } }>,
  ): { mergedOperations: unknown[]; opCounts: number[] } {
    const mergedOperations: unknown[] = []
    const opCounts: number[] = []
    // Each fs_edit call carries one flat edit; carry its whole args object
    // through as a single operation element. getFsEditPlan's operations branch
    // parses each element via parseFlatFsEditArgs.
    for (const entry of entries) {
      const args =
        getToolCallArgumentsObject(entry.toolCall.request.arguments) ?? {}
      opCounts.push(1)
      mergedOperations.push(args)
    }
    return { mergedOperations, opCounts }
  }

  private splitBatchedFsEditResponse({
    response,
    opCounts,
    path,
  }: {
    response: ToolCallResponse
    opCounts: number[]
    path: string
  }): ToolCallResponse[] {
    // Non-success outcomes (Rejected/Aborted/Error) apply to the whole batch.
    if (response.status !== ToolCallResponseStatus.Success) {
      return opCounts.map(() => response)
    }

    // Leader keeps the full response (including editSummary / contentParts).
    // Followers get a lightweight success note that points back to the
    // unified diff for attribution.
    return opCounts.map((count, idx) => {
      if (idx === 0) {
        return response
      }
      const plural = count === 1 ? '' : 's'
      return {
        status: ToolCallResponseStatus.Success,
        data: {
          type: 'text',
          text:
            `Applied ${count} operation${plural} to ${path} as part of a batched fs_edit. ` +
            `The first fs_edit call in this batch carries the unified diff.`,
        },
      }
    })
  }

  hasPendingToolCalls(toolMessage: ChatToolMessage): boolean {
    // `AwaitingUserInput` is a paused state (model is blocked waiting for the
    // user to answer `ask_user_question`). The runtime treats it the same as
    // PendingApproval/Running so the agent loop knows the round is not yet
    // finished and will not try to continue without the user's input.
    return toolMessage.toolCalls.some((toolCall) =>
      [
        ToolCallResponseStatus.PendingApproval,
        ToolCallResponseStatus.Running,
        ToolCallResponseStatus.AwaitingUserInput,
      ].includes(toolCall.response.status),
    )
  }

  abortToolCall(id: string): boolean {
    return this.toolManager.abortToolCall(id)
  }

  private shouldAutoExecuteTool({
    request,
    conversationId,
  }: {
    request: ToolCallRequest
    conversationId: string
  }): boolean {
    if (!this.isToolAllowed(request.name)) {
      return false
    }
    const requestArgs = getToolCallArgumentsObject(request.arguments)
    if (this.isBlockedTerminalCommand(requestArgs, request.name)) {
      return false
    }

    if (this.bypassToolApproval) {
      return this.toolManager.isToolExecutionAllowed({
        requestToolName: request.name,
        conversationId: this.toolApprovalConversationId ?? conversationId,
        requestArgs,
        requireAutoExecution: true,
      })
    }

    const approvalMode = getAssistantToolApprovalMode(
      {
        toolPreferences: this.toolPreferences,
      },
      request.name,
    )
    const requireAutoExecution =
      approvalMode === 'full_access' ||
      this.isReadonlyTerminalCommandToolCall(requestArgs, request.name)

    return this.toolManager.isToolExecutionAllowed({
      requestToolName: request.name,
      conversationId: this.toolApprovalConversationId ?? conversationId,
      requestArgs,
      requireAutoExecution,
    })
  }

  private isReadonlyTerminalCommandToolCall(
    args: Record<string, unknown> | undefined,
    toolName: string,
  ): boolean {
    try {
      const parsed = parseToolName(toolName)
      if (
        parsed.namespace !== getBuiltinToolNamespace() ||
        parsed.toolName !== TERMINAL_COMMAND_TOOL_NAME
      ) {
        return false
      }
    } catch {
      return false
    }

    if (!args || typeof args.command !== 'string') {
      return false
    }
    if (args.input !== undefined || args.kill !== undefined) {
      return false
    }

    return classifyBashCommandSafety(
      args.command,
      Platform.isWin ? 'powershell' : 'posix',
    ).readonly
  }

  private isBlockedTerminalCommand(
    args: Record<string, unknown> | undefined,
    toolName: string,
  ): boolean {
    try {
      const parsed = parseToolName(toolName)
      if (
        parsed.namespace !== getBuiltinToolNamespace() ||
        parsed.toolName !== TERMINAL_COMMAND_TOOL_NAME
      ) {
        return false
      }
    } catch {
      return false
    }

    if (typeof args?.command !== 'string') {
      return false
    }

    return isBlockedByCommandPrefix(
      args.command,
      this.blockedCommandPrefixes ?? DEFAULT_BLOCKED_PREFIXES,
    )
  }

  private shouldUseFsEditReview(toolName: string): boolean {
    if (this.bypassToolApproval) {
      return false
    }
    try {
      const parsed = parseToolName(toolName)
      return (
        parsed.namespace === getBuiltinToolNamespace() &&
        parsed.toolName === 'fs_edit' &&
        getAssistantToolApprovalMode(
          {
            toolPreferences: this.toolPreferences,
          },
          toolName,
        ) === 'require_approval'
      )
    } catch {
      return false
    }
  }

  private isToolAllowed(toolName: string): boolean {
    if (!this.toolsEnabled) {
      return false
    }
    if (this.isSubagentChildRun && isSubagentBlockedToolName(toolName)) {
      return false
    }
    if (!this.allowedToolNames) {
      return true
    }
    if (!this.allowedToolNames.has(toolName)) {
      return false
    }

    return isAssistantToolEnabled(
      {
        toolPreferences: this.toolPreferences,
      },
      toolName,
    )
  }
}
