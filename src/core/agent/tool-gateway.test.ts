import {
  ToolCallResponseStatus,
  createCompleteToolCallArguments,
  createPartialToolCallArguments,
} from '../../types/tool-call.types'
import { ToolManager } from '../tools/toolManager'

import { AgentToolGateway } from './tool-gateway'

describe('AgentToolGateway', () => {
  const emptyArgs = createCompleteToolCallArguments({ value: {} })

  it('keeps tools pending when approval is required', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(false),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__tool_a'],
      toolPreferences: {
        yolo_local__tool_a: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        { id: 'tool-1', name: 'yolo_local__tool_a', arguments: emptyArgs },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.PendingApproval,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).toHaveBeenCalledWith({
      requestToolName: 'yolo_local__tool_a',
      conversationId: 'conv-1',
      requestArgs: {},
      requireAutoExecution: false,
    })
  })

  it('rejects malformed local write arguments before execution', async () => {
    const callTool = jest.fn()
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      callTool,
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__fs_write'],
      toolPreferences: {
        yolo_local__fs_write: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_write',
          arguments: createPartialToolCallArguments(
            '{"path":"note.md","content":',
          ),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response).toEqual({
      status: ToolCallResponseStatus.Error,
      error: expect.stringContaining('Tool argument parsing failed'),
    })
    const response = message.toolCalls[0]?.response
    if (response?.status !== ToolCallResponseStatus.Error) {
      throw new Error('expected error')
    }
    expect(response.error).toContain('Provided parameter names: content, path')
    expect(response.error).toContain('Required parameter names: path, content')
    expect(response.error).toContain('Raw args length:')
    expect(response.error).toContain('finishReason:')

    const executed = await gateway.executeAutoToolCalls({
      toolMessage: message,
      conversationId: 'conv-1',
    })

    expect(executed.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Error,
    )
    expect(callTool).not.toHaveBeenCalled()
  })

  it('repairs incomplete local write JSON before execution', async () => {
    const callTool = jest.fn().mockResolvedValue({
      status: ToolCallResponseStatus.Success,
      data: { type: 'text', text: 'ok' },
    })
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      callTool,
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__fs_write'],
      toolPreferences: {
        yolo_local__fs_write: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_write',
          arguments: createPartialToolCallArguments(
            '{"path":"note.md","content":"hello"',
          ),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )
    expect(message.toolCalls[0]?.request.arguments?.kind).toBe('complete')

    const executed = await gateway.executeAutoToolCalls({
      toolMessage: message,
      conversationId: 'conv-1',
    })

    expect(executed.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Success,
    )
    expect(callTool).toHaveBeenCalledTimes(1)
    expect(callTool).toHaveBeenCalledWith(
      expect.objectContaining({
        args: { path: 'note.md', content: 'hello' },
      }),
    )
  })

  it('rejects local write repair that would close an unterminated content string', async () => {
    const callTool = jest.fn()
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      callTool,
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__fs_write'],
      toolPreferences: {
        yolo_local__fs_write: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_write',
          arguments: createPartialToolCallArguments(
            '{"path":"note.md","content":"half written',
          ),
        },
      ],
      conversationId: 'conv-1',
    })

    const response = message.toolCalls[0]?.response
    expect(response?.status).toBe(ToolCallResponseStatus.Error)
    if (response?.status !== ToolCallResponseStatus.Error) {
      throw new Error('expected error')
    }
    expect(response.error).toContain('unterminated string')
    expect(response.error).toContain('file content was truncated')

    const executed = await gateway.executeAutoToolCalls({
      toolMessage: message,
      conversationId: 'conv-1',
    })

    expect(executed.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Error,
    )
    expect(callTool).not.toHaveBeenCalled()
  })

  it('reports missing fs_edit locator fields before execution', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__fs_edit'],
      toolPreferences: {
        yolo_local__fs_edit: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_edit',
          arguments: createCompleteToolCallArguments({
            value: { path: 'note.md', newText: 'x' },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    const response = message.toolCalls[0]?.response
    expect(response?.status).toBe(ToolCallResponseStatus.Error)
    if (response?.status !== ToolCallResponseStatus.Error) {
      throw new Error('expected error')
    }
    expect(response.error).toContain('startLine must be an integer')
    expect(response.error).toContain('endLine must be an integer')
    expect(response.error).toContain('"path":"note.md"')
  })

  it('auto executes read-only terminal commands even when terminal_command requires approval', () => {
    const toolManager = {
      isToolExecutionAllowed: jest
        .fn()
        .mockImplementation(({ requireAutoExecution }) => requireAutoExecution),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__terminal_command'],
      toolPreferences: {
        yolo_local__terminal_command: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'git status --short | head -20' },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).toHaveBeenCalledWith({
      requestToolName: 'yolo_local__terminal_command',
      conversationId: 'conv-1',
      requestArgs: { command: 'git status --short | head -20' },
      requireAutoExecution: true,
    })
  })

  it('keeps mutating terminal commands pending for approval', () => {
    const toolManager = {
      isToolExecutionAllowed: jest
        .fn()
        .mockImplementation(({ requireAutoExecution }) => requireAutoExecution),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__terminal_command'],
      toolPreferences: {
        yolo_local__terminal_command: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'echo hello > out.txt' },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.PendingApproval,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).toHaveBeenCalledWith({
      requestToolName: 'yolo_local__terminal_command',
      conversationId: 'conv-1',
      requestArgs: { command: 'echo hello > out.txt' },
      requireAutoExecution: false,
    })
  })

  it('auto executes require_approval tools when bypassToolApproval is enabled', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      bypassToolApproval: true,
      allowedToolNames: ['yolo_local__tool_a'],
      toolPreferences: {
        yolo_local__tool_a: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        { id: 'tool-1', name: 'yolo_local__tool_a', arguments: emptyArgs },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).toHaveBeenCalledWith({
      requestToolName: 'yolo_local__tool_a',
      conversationId: 'conv-1',
      requestArgs: {},
      requireAutoExecution: true,
    })
  })

  it('still rejects blocked terminal commands when bypassToolApproval is enabled', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      bypassToolApproval: true,
      allowedToolNames: ['yolo_local__terminal_command'],
      toolPreferences: {
        yolo_local__terminal_command: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'rm -rf test-dir' },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Error,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).not.toHaveBeenCalled()
  })

  it('rejects blocked terminal command prefixes before approval', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__terminal_command'],
      toolPreferences: {
        yolo_local__terminal_command: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'rm -rf test-dir' },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Error,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).not.toHaveBeenCalled()
  })

  it('allows blocked terminal defaults to be cleared explicitly', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__terminal_command'],
      blockedCommandPrefixes: [],
      toolPreferences: {
        yolo_local__terminal_command: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'rm -rf test-dir' },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )
  })

  it('serializes sibling foreground terminal commands on the shared session lane', async () => {
    let activeCalls = 0
    let maxActiveCalls = 0
    const callOrder: string[] = []
    const callTool = jest.fn().mockImplementation(async ({ id }) => {
      activeCalls += 1
      maxActiveCalls = Math.max(maxActiveCalls, activeCalls)
      callOrder.push(id)
      await new Promise((resolve) => setTimeout(resolve, 5))
      activeCalls -= 1
      return {
        status: ToolCallResponseStatus.Success,
        data: { type: 'text', text: id },
      }
    })
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      callTool,
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__terminal_command'],
      toolPreferences: {
        yolo_local__terminal_command: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'echo one' },
          }),
        },
        {
          id: 'tool-2',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'echo two' },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    const result = await gateway.executeAutoToolCalls({
      toolMessage: message,
      conversationId: 'conv-1',
    })

    expect(callTool).toHaveBeenCalledTimes(2)
    expect(maxActiveCalls).toBe(1)
    expect(callOrder).toEqual(['tool-1', 'tool-2'])
    expect(result.toolCalls.map((call) => call.response.status)).toEqual([
      ToolCallResponseStatus.Success,
      ToolCallResponseStatus.Success,
    ])
  })

  it('keeps sibling background terminal commands parallel', async () => {
    let activeCalls = 0
    let maxActiveCalls = 0
    const callTool = jest.fn().mockImplementation(async () => {
      activeCalls += 1
      maxActiveCalls = Math.max(maxActiveCalls, activeCalls)
      await new Promise((resolve) => setTimeout(resolve, 5))
      activeCalls -= 1
      return {
        status: ToolCallResponseStatus.Success,
        data: { type: 'text', text: 'ok' },
      }
    })
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      callTool,
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__terminal_command'],
      toolPreferences: {
        yolo_local__terminal_command: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'sleep 1', background: true },
          }),
        },
        {
          id: 'tool-2',
          name: 'yolo_local__terminal_command',
          arguments: createCompleteToolCallArguments({
            value: { command: 'sleep 1', background: true },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    await gateway.executeAutoToolCalls({
      toolMessage: message,
      conversationId: 'conv-1',
    })

    expect(callTool).toHaveBeenCalledTimes(2)
    expect(maxActiveCalls).toBe(2)
  })

  it('allows conversation-level approval to bypass per-tool approval', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__tool_a'],
      toolPreferences: {
        yolo_local__tool_a: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        { id: 'tool-1', name: 'yolo_local__tool_a', arguments: emptyArgs },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )
  })

  it('uses the parent approval conversation for subagent child runs', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      isSubagentChildRun: true,
      toolApprovalConversationId: 'parent-conv',
      allowedToolNames: ['yolo_local__tool_a'],
      toolPreferences: {
        yolo_local__tool_a: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        { id: 'tool-1', name: 'yolo_local__tool_a', arguments: emptyArgs },
      ],
      conversationId: 'subagent-task',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).toHaveBeenCalledWith({
      requestToolName: 'yolo_local__tool_a',
      conversationId: 'parent-conv',
      requestArgs: {},
      requireAutoExecution: false,
    })
  })

  it('routes approval-required subagent child calls to PendingApproval (parent UI)', () => {
    // Subagent approval requests bubble up to the SubagentCard's inline
    // approval block in the parent conversation. See
    // `docs/plans/2026-06-18-subagent-tool-approval-routing.md`.
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(false),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      isSubagentChildRun: true,
      allowedToolNames: ['yolo_local__tool_a'],
      toolPreferences: {
        yolo_local__tool_a: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        { id: 'tool-1', name: 'yolo_local__tool_a', arguments: emptyArgs },
      ],
      conversationId: 'subagent-task',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.PendingApproval,
    )
  })

  it('runs fs_edit immediately when approval mode requires review', async () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(false),
      callTool: jest.fn().mockResolvedValue({
        status: ToolCallResponseStatus.Success,
        data: { type: 'text', text: '{}' },
      }),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__fs_edit'],
      toolPreferences: {
        yolo_local__fs_edit: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_edit',
          arguments: createCompleteToolCallArguments({
            value: {
              path: 'note.md',
              oldText: 'before',
              newText: 'after',
            },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )

    await gateway.executeAutoToolCalls({
      toolMessage: message,
      conversationId: 'conv-1',
    })

    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const callToolMock = toolManager.callTool
    expect(callToolMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'yolo_local__fs_edit',
        args: {
          path: 'note.md',
          oldText: 'before',
          newText: 'after',
        },
        id: 'tool-1',
        conversationId: 'conv-1',
        conversationMessages: undefined,
        roundId: message.id,
        requireReview: true,
        signal: undefined,
      }),
    )
  })

  it('opens fs_edit review for subagent child runs (same as parent flow)', () => {
    // After the approval-routing refactor, subagent fs_edit calls go through
    // the same review (inline diff) path as parent calls when the tool is in
    // require_approval mode. The user's approval target is the SubagentCard.
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(false),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      isSubagentChildRun: true,
      allowedToolNames: ['yolo_local__fs_edit'],
      toolPreferences: {
        yolo_local__fs_edit: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_edit',
          arguments: createCompleteToolCallArguments({
            value: {
              path: 'note.md',
              oldText: 'before',
              newText: 'after',
            },
          }),
        },
      ],
      conversationId: 'subagent-task',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Running,
    )
  })

  it('rejects tool calls when tools are disabled', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn(),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      toolsEnabled: false,
      allowedToolNames: ['yolo_local__tool_a'],
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        { id: 'tool-1', name: 'yolo_local__tool_a', arguments: emptyArgs },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response.status).toBe(
      ToolCallResponseStatus.Rejected,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).not.toHaveBeenCalled()
  })

  it('merges sibling fs_edit calls targeting the same path into one batched invocation', async () => {
    const callTool = jest.fn().mockResolvedValue({
      status: ToolCallResponseStatus.Success,
      data: { type: 'text', text: '{"tool":"fs_edit"}' },
    })
    const toolManager = {
      isToolExecutionAllowed: jest.fn().mockReturnValue(true),
      callTool,
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__fs_edit'],
      toolPreferences: {
        yolo_local__fs_edit: {
          enabled: true,
          approvalMode: 'full_access',
        },
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_edit',
          arguments: createCompleteToolCallArguments({
            value: {
              path: 'note.md',
              oldText: 'foo',
              newText: 'FOO',
            },
          }),
        },
        {
          id: 'tool-2',
          name: 'yolo_local__fs_edit',
          arguments: createCompleteToolCallArguments({
            value: {
              path: 'note.md',
              oldText: 'bar',
              newText: 'BAR',
            },
          }),
        },
        {
          id: 'tool-3',
          name: 'yolo_local__fs_edit',
          arguments: createCompleteToolCallArguments({
            value: {
              path: 'other.md',
              oldText: 'tail',
              newText: 'TAIL',
            },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    const result = await gateway.executeAutoToolCalls({
      toolMessage: message,
      conversationId: 'conv-1',
    })

    // Two distinct invocations: one batched for note.md, one for other.md.
    expect(callTool).toHaveBeenCalledTimes(2)
    const noteCall = callTool.mock.calls.find(
      ([args]: [{ args?: { path?: string } }]) => args.args?.path === 'note.md',
    )
    expect(noteCall).toBeDefined()
    expect(noteCall![0].id).toBe('tool-1')
    expect(noteCall![0].args).toEqual({
      path: 'note.md',
      operations: [
        { path: 'note.md', oldText: 'foo', newText: 'FOO' },
        { path: 'note.md', oldText: 'bar', newText: 'BAR' },
      ],
    })

    // All three tool calls resolve to Success.
    expect(result.toolCalls.map((call) => call.response.status)).toEqual([
      ToolCallResponseStatus.Success,
      ToolCallResponseStatus.Success,
      ToolCallResponseStatus.Success,
    ])

    // The leader carries the full response; followers get a batch note.
    const followerResponse = result.toolCalls[1].response
    if (followerResponse.status === ToolCallResponseStatus.Success) {
      expect(followerResponse.data.text).toContain('batched fs_edit')
      expect(followerResponse.data.text).toContain('note.md')
    }
  })

  it('rejects tool calls outside the allowed tool list', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn(),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__tool_a'],
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        { id: 'tool-1', name: 'yolo_local__tool_b', arguments: emptyArgs },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response).toEqual({
      status: ToolCallResponseStatus.Rejected,
      reason: 'Tool "yolo_local__tool_b" is not available in this workspace.',
    })
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock function accessed for assertion
    const isToolExecutionAllowedMock = toolManager.isToolExecutionAllowed
    expect(isToolExecutionAllowedMock).not.toHaveBeenCalled()
  })

  it('explains workspace scope path rejections', () => {
    const toolManager = {
      isToolExecutionAllowed: jest.fn(),
      getJsSandboxSettings: jest.fn().mockReturnValue({}),
    } as unknown as ToolManager

    const gateway = new AgentToolGateway(toolManager, {
      allowedToolNames: ['yolo_local__fs_read'],
      toolPreferences: {
        yolo_local__fs_read: { enabled: true },
      },
      workspaceScope: {
        enabled: true,
        include: ['Notes'],
        exclude: [],
      },
    })

    const message = gateway.createToolMessage({
      toolCallRequests: [
        {
          id: 'tool-1',
          name: 'yolo_local__fs_read',
          arguments: createCompleteToolCallArguments({
            value: { paths: ['Private/secret.md'] },
          }),
        },
      ],
      conversationId: 'conv-1',
    })

    expect(message.toolCalls[0]?.response).toEqual({
      status: ToolCallResponseStatus.Rejected,
      reason:
        'Path "Private/secret.md" is outside this agent\'s workspace scope. Do not attempt to bypass this restriction. If the task requires this path, tell the user that it is outside the configured workspace scope.',
    })
  })
})
