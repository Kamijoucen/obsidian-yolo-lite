import type { ToolDefinition } from '../../types/tool.types'

import { expandAllowedToolNames, selectAllowedTools } from './tool-selection'

describe('expandAllowedToolNames', () => {
  it('expands file operation groups', () => {
    const expanded = expandAllowedToolNames([
      'yolo_local__fs_edit_ops',
      'yolo_local__fs_file_ops',
    ])
    expect(expanded?.has('yolo_local__fs_edit')).toBe(true)
    expect(expanded?.has('yolo_local__fs_write')).toBe(true)
    expect(expanded?.has('yolo_local__fs_delete')).toBe(true)
  })
})

describe('selectAllowedTools', () => {
  it('filters tools and sends their full schemas', async () => {
    const availableTools: ToolDefinition[] = [
      {
        name: 'yolo_local__fs_read',
        description: 'Read a file',
        inputSchema: {
          type: 'object',
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
      },
      {
        name: 'yolo_local__fs_write',
        description: 'Write a file',
        inputSchema: { type: 'object', properties: {} },
      },
    ]

    const result = await selectAllowedTools({
      availableTools,
      allowedToolNames: ['yolo_local__fs_read'],
    })

    expect(result.filteredTools.map((tool) => tool.name)).toEqual([
      'yolo_local__fs_read',
    ])
    expect(result.requestTools?.[0]?.function.parameters).toEqual({
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    })
  })
})
