import {
  getLocalFileTools,
  isLocalFsWriteToolName,
  parseBrowserReadPageId,
  parseLocalFsActionFromToolArgs,
  validateAskUserQuestionArgs,
} from './localFileTools'

describe('local MCP tools', () => {
  it('exposes keyword-only vault search', () => {
    const search = getLocalFileTools().find((tool) => tool.name === 'fs_search')
    expect(search?.inputSchema.properties?.mode).toMatchObject({
      enum: ['keyword'],
    })
    expect(search?.inputSchema.properties?.query).toBeDefined()
  })

  it('recognizes local write tools and their actions', () => {
    expect(isLocalFsWriteToolName('yolo_local__fs_edit')).toBe(true)
    expect(isLocalFsWriteToolName('yolo_local__fs_read')).toBe(false)
    expect(
      parseLocalFsActionFromToolArgs({
        toolName: 'yolo_local__fs_delete',
      }),
    ).toBe('delete')
  })

  it('parses browser page identifiers but rejects URLs', () => {
    expect(parseBrowserReadPageId('browser://page_abcdefgh_12345678')).toBe(
      'page_abcdefgh_12345678',
    )
    expect(() => parseBrowserReadPageId('https://example.com')).toThrow()
  })

  it('validates ask-user-question arguments', () => {
    expect(
      validateAskUserQuestionArgs({
        questions: [
          {
            id: 'choice',
            prompt: 'Choose one',
            inputType: 'single_select',
            options: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
          },
        ],
      }).ok,
    ).toBe(true)
  })
})
