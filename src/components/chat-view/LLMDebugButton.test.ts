import {
  bindLLMDebugTraceToSignal,
  createLLMDebugFetch,
  createLLMDebugTrace,
  flushLLMDebugTraceReads,
  getLLMDebugTraces,
  registerLLMDebugTraceForTurn,
  runWithLLMDebugTrace,
  setLLMDebugCaptureEnabled,
} from '../../core/llm/debugCapture'
import { buildLLMDebugMarkdown } from '../../core/llm/debugMarkdown'
import type { ChatAssistantMessage } from '../../types/chat'

import { getLLMDebugTraceIdsForMessages } from './llmDebugTraceSelection'

describe('getLLMDebugTraceIdsForMessages', () => {
  afterEach(() => setLLMDebugCaptureEnabled(false))

  it('collects the main and title-generation requests for one turn', async () => {
    setLLMDebugCaptureEnabled(true)
    const fetch = createLLMDebugFetch(
      jest.fn(async (input) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: url.includes('title') ? 'Title' : 'Answer',
                },
              },
            ],
          }),
          { headers: { 'content-type': 'application/json' } },
        )
      }),
      'browser',
    )
    const main = createLLMDebugTrace({ requestKind: 'non-streaming' })
    const title = createLLMDebugTrace({ requestKind: 'title-generation' })
    registerLLMDebugTraceForTurn({
      conversationId: 'conversation-1',
      sourceUserMessageId: 'user-1',
      traceId: title.id,
    })
    const mainController = new AbortController()
    const titleController = new AbortController()
    bindLLMDebugTraceToSignal(main.id, mainController.signal)
    bindLLMDebugTraceToSignal(title.id, titleController.signal)

    await Promise.all([
      runWithLLMDebugTrace(main.id, () =>
        fetch('https://example.test/v1/chat/completions', {
          method: 'POST',
          body: JSON.stringify({ model: 'gpt-5', messages: [] }),
          signal: mainController.signal,
        }),
      ),
      runWithLLMDebugTrace(title.id, () =>
        fetch('https://example.test/v1/title', {
          method: 'POST',
          body: JSON.stringify({
            model: 'gpt-5-mini',
            messages: [
              { role: 'system', content: 'You are a title generator.' },
            ],
          }),
          signal: titleController.signal,
        }),
      ),
    ])
    await flushLLMDebugTraceReads([main.id, title.id])

    const message: ChatAssistantMessage = {
      role: 'assistant',
      id: 'assistant-1',
      content: 'Answer',
      metadata: {
        branchConversationId: 'conversation-1',
        llmDebugTraceId: main.id,
      },
    }
    const ids = getLLMDebugTraceIdsForMessages([message])
    expect(ids).toEqual(expect.arrayContaining([main.id, title.id]))
    const markdown = buildLLMDebugMarkdown(getLLMDebugTraces(ids))
    expect(markdown).toContain('Title generation request')
  })
})
