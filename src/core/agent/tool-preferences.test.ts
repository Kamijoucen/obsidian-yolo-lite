import {
  getAssistantToolApprovalMode,
  getDefaultEnabledForTool,
  getEnabledAssistantToolNames,
  isAssistantToolEnabled,
  pruneOrphanedAssistantToolPreferences,
  renameAssistantToolPreferencesServer,
} from './tool-preferences'

const JS_SANDBOX_FQN = 'yolo_local__js_eval'

describe('tool preference defaults', () => {
  it('enables supported built-in tools outside the deny-list', () => {
    expect(getDefaultEnabledForTool('yolo_local__fs_read')).toBe(true)
    expect(getDefaultEnabledForTool('yolo_local__fs_edit')).toBe(true)
  })

  it('does not enable protocol-only, sensitive, remote, or unknown tools', () => {
    expect(getDefaultEnabledForTool('yolo_local__load_tool_schemas')).toBe(
      false,
    )
    expect(getDefaultEnabledForTool('yolo_local__context_compact')).toBe(false)
    expect(getDefaultEnabledForTool(JS_SANDBOX_FQN)).toBe(false)
    expect(getDefaultEnabledForTool('Browser__get_all_tabs')).toBe(false)
    expect(getDefaultEnabledForTool('yolo_local__unknown_tool')).toBe(false)
    expect(getDefaultEnabledForTool('not_a_qualified_name')).toBe(false)
  })
})

describe('assistant tool preferences', () => {
  it('uses toolPreferences as the only enabled-state source', () => {
    const assistant = {
      toolPreferences: {
        yolo_local__fs_read: { enabled: true },
        yolo_local__fs_edit: { enabled: false },
        Browser__get_all_tabs: { enabled: true },
      },
    }

    expect(isAssistantToolEnabled(assistant, 'yolo_local__fs_read')).toBe(true)
    expect(isAssistantToolEnabled(assistant, 'yolo_local__fs_edit')).toBe(false)
    expect(getEnabledAssistantToolNames(assistant)).toEqual([
      'yolo_local__fs_read',
      'Browser__get_all_tabs',
    ])
  })

  it('treats absent preferences as disabled', () => {
    expect(isAssistantToolEnabled({ toolPreferences: {} }, 'x__tool')).toBe(
      false,
    )
    expect(getEnabledAssistantToolNames({ toolPreferences: {} })).toEqual([])
  })

  it('drops built-in tools when includeBuiltinTools is false', () => {
    expect(
      getEnabledAssistantToolNames({
        toolPreferences: {
          yolo_local__fs_read: { enabled: true },
          Browser__get_all_tabs: { enabled: true },
        },
        includeBuiltinTools: false,
      }),
    ).toEqual(['Browser__get_all_tabs'])
  })

  it.each(['full_access', 'require_approval'] as const)(
    'honors the saved JavaScript approval mode %s',
    (approvalMode) => {
      expect(
        getAssistantToolApprovalMode(
          {
            toolPreferences: {
              [JS_SANDBOX_FQN]: { enabled: true, approvalMode },
            },
          },
          JS_SANDBOX_FQN,
        ),
      ).toBe(approvalMode)
    },
  )

  it('uses server-level approval for remote MCP tools', () => {
    expect(
      getAssistantToolApprovalMode(
        {
          toolPreferences: { server__tool: { enabled: true } },
          toolServerPreferences: {
            server: { approvalMode: 'full_access' as const },
          },
        },
        'server__tool',
      ),
    ).toBe('full_access')
  })
})

describe('MCP server preference maintenance', () => {
  it('prunes preferences for unknown servers', () => {
    const result = pruneOrphanedAssistantToolPreferences(
      {
        toolPreferences: {
          yolo_local__fs_read: { enabled: true },
          Browser__click: { enabled: true },
          github__list: { enabled: true },
        },
        toolServerPreferences: {
          Browser: { approvalMode: 'full_access' as const },
          github: { approvalMode: 'require_approval' as const },
        },
      },
      new Set(['yolo_local', 'github']),
    )

    expect(Object.keys(result.toolPreferences ?? {})).toEqual([
      'yolo_local__fs_read',
      'github__list',
    ])
    expect(result.toolServerPreferences).toEqual({
      github: { approvalMode: 'require_approval' },
    })
  })

  it('returns the same object when pruning changes nothing', () => {
    const input = {
      toolPreferences: { yolo_local__fs_read: { enabled: true } },
    }
    expect(
      pruneOrphanedAssistantToolPreferences(input, new Set(['yolo_local'])),
    ).toBe(input)
  })

  it('renames tool and server preference keys', () => {
    const result = renameAssistantToolPreferencesServer(
      {
        toolPreferences: {
          old__a: { enabled: true },
          old__b: { enabled: false },
          yolo_local__fs_read: { enabled: true },
        },
        toolServerPreferences: {
          old: { approvalMode: 'full_access' as const },
        },
      },
      'old',
      'new',
    )

    expect(result.toolPreferences).toEqual({
      new__a: { enabled: true },
      new__b: { enabled: false },
      yolo_local__fs_read: { enabled: true },
    })
    expect(result.toolServerPreferences).toEqual({
      new: { approvalMode: 'full_access' },
    })
  })
})
