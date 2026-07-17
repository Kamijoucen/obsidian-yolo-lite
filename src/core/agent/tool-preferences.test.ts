import {
  getAssistantToolApprovalMode,
  getDefaultEnabledForTool,
  getEnabledAssistantToolNames,
  isAssistantToolEnabled,
} from './tool-preferences'

describe('built-in tool preferences', () => {
  it('enables safe built-in defaults and rejects unknown namespaces', () => {
    expect(getDefaultEnabledForTool('yolo_local__fs_read')).toBe(true)
    expect(getDefaultEnabledForTool('yolo_local__context_compact')).toBe(false)
    expect(getDefaultEnabledForTool('unknown__tool')).toBe(false)
  })

  it('uses explicit built-in preferences as the enabled source', () => {
    const assistant = {
      toolPreferences: {
        yolo_local__fs_read: { enabled: true },
        yolo_local__fs_edit: { enabled: false },
        unknown__tool: { enabled: true },
      },
    }
    expect(isAssistantToolEnabled(assistant, 'yolo_local__fs_read')).toBe(true)
    expect(getEnabledAssistantToolNames(assistant)).toEqual([
      'yolo_local__fs_read',
    ])
  })

  it('honors per-tool approval and the built-in fallback', () => {
    expect(
      getAssistantToolApprovalMode(
        {
          toolPreferences: {
            yolo_local__js_eval: {
              enabled: true,
              approvalMode: 'full_access' as const,
            },
          },
        },
        'yolo_local__js_eval',
      ),
    ).toBe('full_access')
    expect(
      getAssistantToolApprovalMode(undefined, 'yolo_local__fs_write'),
    ).toBe('require_approval')
  })
})
