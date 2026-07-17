import type { LLMDebugTrace } from './debugCapture'
import { buildLLMDebugMarkdown } from './debugMarkdown'

function createTrace(
  responseBody: string,
  contentType?: string,
): LLMDebugTrace {
  return {
    id: 'trace-1',
    summary: {
      requestKind: 'streaming',
      startedAt: 1_700_000_000_000,
      completedAt: 1_700_000_001_000,
      durationMs: 1000,
      generationState: 'completed',
    },
    exchanges: [
      {
        id: 'exchange-1',
        traceId: 'trace-1',
        transportMode: 'browser',
        startedAt: 1_700_000_000_000,
        completedAt: 1_700_000_001_000,
        request: {
          url: 'https://example.test/v1/responses',
          method: 'POST',
          headers: {},
          body: '{"model":"gpt-test","messages":[]}',
        },
        response: {
          status: 200,
          statusText: 'OK',
          headers: {},
          contentType,
          body: responseBody,
        },
      },
    ],
  }
}

describe('buildLLMDebugMarkdown', () => {
  it('labels formatted bodies simply and notes formatting after the block', () => {
    const markdown = buildLLMDebugMarkdown([
      createTrace('{"ok":true}', 'application/json'),
    ])

    expect(markdown).toContain('Body:\n```json')
    expect(markdown).toContain('```\n(pretty-printed)')
    expect(markdown).not.toContain('#### Summary')
    expect(markdown).not.toContain('### Overall Summary')
    expect(markdown).not.toContain('Captured Body (formatted):')
    expect(markdown).not.toContain('Raw Body')
  })

  it('extracts Responses stream deltas without duplicating final snapshots', () => {
    const responseBody = [
      'data: {"type":"response.output_text.delta","delta":"Hel"}',
      'data: {"type":"response.output_text.delta","delta":"lo"}',
      'data: {"type":"response.output_text.done","text":"Hello"}',
      'data: {"type":"response.output_item.done","item":{"type":"function_call","name":"lookup","arguments":"{\\"q\\":\\"x\\"}"}}',
      'data: {"type":"response.completed","response":{"output":[{"type":"message","content":[{"type":"output_text","text":"Hello"}]}]}}',
      'data: [DONE]',
    ].join('\n')

    const markdown = buildLLMDebugMarkdown([
      createTrace(responseBody, 'text/event-stream'),
    ])

    expect(markdown).toContain('### #1 ')
    expect(markdown).toContain('- Streaming: true')
    expect(markdown).not.toContain('- Nature:')
    expect(markdown).not.toContain('Attempt 1')
    expect(markdown).toContain('Reasoning (Extracted):')
    expect(markdown).toContain('Content (Extracted):')
    expect(markdown).toContain('Tool Calls (Extracted):')
    expect(markdown).toContain('name: lookup')
    expect(markdown).toContain('arguments: {"q":"x"}')
    expect(markdown).toContain('```text\nHello\n```')
    expect(markdown).not.toContain('HelloHello')
    expect(markdown).toContain('Body (Raw Stream):')
    expect(markdown).toContain('Body (Raw Stream):\n```json')
    expect(markdown).toContain('(streaming JSON data lines compacted)')
    expect(markdown).not.toContain('Raw Body')
  })

  it('extracts readable parts from non-streaming responses before raw body', () => {
    const trace = createTrace(
      JSON.stringify({
        choices: [
          {
            message: {
              reasoning: 'because it matters',
              content: 'final answer',
              tool_calls: [
                {
                  function: {
                    name: 'lookup',
                    arguments: '{"q":"x"}',
                  },
                },
              ],
            },
          },
        ],
      }),
      'application/json',
    )

    const markdown = buildLLMDebugMarkdown([trace])

    expect(markdown).toContain('Reasoning (Extracted):')
    expect(markdown).toContain('```text\nbecause it matters\n```')
    expect(markdown).toContain('Content (Extracted):')
    expect(markdown).toContain('```text\nfinal answer\n```')
    expect(markdown).toContain('Tool Calls (Extracted):')
    expect(markdown).toContain('name: lookup')
    expect(markdown).toContain('arguments: {"q":"x"}')
    expect(markdown).toContain('Body (Raw):\n```json')
    expect(markdown).toContain('- Streaming: false')
    expect(markdown).not.toContain('- Request type:')
  })

  it('joins streamed tool call argument deltas into one readable call', () => {
    const responseBody = [
      'data: {"type":"response.output_item.added","item":{"id":"call-1","type":"function_call","name":"yolo_local__web_search"}}',
      'data: {"type":"response.function_call_arguments.delta","item_id":"call-1","delta":"{\\"query\\":"}',
      'data: {"type":"response.function_call_arguments.delta","item_id":"call-1","delta":"\\"2026年5月15日 今日 新闻\\""}',
      'data: {"type":"response.function_call_arguments.delta","item_id":"call-1","delta":",\\"topic\\":\\"news\\"}"}',
      'data: [DONE]',
    ].join('\n')

    const markdown = buildLLMDebugMarkdown([
      createTrace(responseBody, 'text/event-stream'),
    ])

    expect(markdown).toContain('Tool Calls (Extracted):')
    expect(markdown).toContain('name: yolo_local__web_search')
    expect(markdown).toContain(
      'arguments: {"query":"2026年5月15日 今日 新闻","topic":"news"}',
    )
    expect(markdown).not.toContain('arguments_delta')
    expect(markdown).not.toContain('\narguments: {\n\narguments:')
  })

  it('does not label internal tool calls as LLM provider/model requests', () => {
    const trace = createTrace('{"ok":true}', 'application/json')
    trace.summary.providerId = 'openai'
    trace.summary.modelName = 'Main model'
    trace.exchanges[0].transportMode = 'internal-tool'
    trace.exchanges[0].request.url = 'tool://server/tool'

    const markdown = buildLLMDebugMarkdown([trace])
    const attemptSection = markdown.slice(markdown.indexOf('### #1'))

    expect(attemptSection).toContain('Tool request - server/tool')
    expect(attemptSection).not.toContain('- Provider: openai')
    expect(attemptSection).not.toContain('- Model: Main model')
  })

  it('sums subrequest costs instead of listing every cost field inline', () => {
    const trace = createTrace(
      '{"usage":{"cost":{"input":0.01,"output":0.02,"total":0.03}}}',
      'application/json',
    )
    trace.exchanges.push({
      ...trace.exchanges[0],
      id: 'exchange-2',
      startedAt: 1_700_000_001_100,
      completedAt: 1_700_000_001_500,
      response: {
        status: 200,
        statusText: 'OK',
        headers: {},
        contentType: 'application/json',
        body: '{"cost":0.04}',
      },
    })

    const markdown = buildLLMDebugMarkdown([trace])

    expect(markdown).toContain('- Cost: 0.07 (from 2 attempts)')
    expect(markdown).not.toContain('usage.cost.input: 0.01,')
    expect(markdown).not.toContain('usage.cost.output: 0.02,')
  })

  it('renders failed request captures without a response', () => {
    const trace = createTrace('', undefined)
    delete trace.exchanges[0].response
    trace.exchanges[0].completedAt = 1_700_000_000_500
    trace.exchanges[0].errorMessage = 'Provider request failed'

    const markdown = buildLLMDebugMarkdown([trace])

    expect(markdown).toContain('- Status: error')
    expect(markdown).toContain('No response received.')
    expect(markdown).toContain('#### Error Information')
    expect(markdown).toContain('Provider request failed')
  })

  it('moves title generation captures to other requests', () => {
    const trace = createTrace('{"title":"Test Title"}', 'application/json')
    trace.summary.requestKind = 'title-generation'
    trace.exchanges[0].request.body = JSON.stringify({
      model: 'gpt-test',
      messages: [
        {
          role: 'system',
          content: 'Return a short label.',
        },
      ],
    })

    const markdown = buildLLMDebugMarkdown([trace])

    expect(markdown).not.toContain('## Subrequest 1')
    expect(markdown).toContain('## Other Requests')
    expect(markdown).toContain('Title generation request')
    expect(markdown).toContain('Content (Extracted):')
    expect(markdown).toContain('```text\nTest Title\n```')
    expect(markdown).not.toContain(
      'Title generation requests are listed here instead of as separate Subrequests.',
    )
  })

  it('omits title generation traces when no exchange was captured', () => {
    const trace = createTrace('', undefined)
    trace.summary.requestKind = 'title-generation'
    trace.summary.modelName = 'Title model'
    trace.summary.generationState = 'completed'
    trace.exchanges = []

    const markdown = buildLLMDebugMarkdown([trace])

    expect(markdown).not.toContain('## Subrequest 1')
    expect(markdown).not.toContain('## Other Requests')
    expect(markdown).not.toContain('Title generation request')
    expect(markdown).not.toContain('(No HTTP exchange was captured.)')
  })

  it('moves title generation exchanges captured inside another trace to other requests', () => {
    const trace = createTrace('{"ok":true}', 'application/json')
    trace.exchanges.push({
      ...trace.exchanges[0],
      id: 'exchange-title',
      startedAt: 1_700_000_001_100,
      completedAt: 1_700_000_001_500,
      request: {
        url: 'https://example.test/v1/chat/completions',
        method: 'POST',
        headers: {},
        body: JSON.stringify({
          model: 'gpt-test',
          messages: [
            { role: 'system', content: 'Return a short label.' },
            { role: 'user', content: 'User first message:\nHello' },
          ],
        }),
      },
      response: {
        status: 200,
        statusText: 'OK',
        headers: {},
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: 'Hello title' } }],
        }),
      },
    })

    const markdown = buildLLMDebugMarkdown([trace])
    const subrequestSection = markdown.slice(
      markdown.indexOf('## Subrequest 1'),
      markdown.indexOf('## Other Requests'),
    )

    expect(markdown).toContain('## Subrequest 1')
    expect(subrequestSection).toContain('### #1 Main LLM request')
    expect(subrequestSection).not.toContain('Title generation request')
    expect(markdown).toContain('## Other Requests')
    expect(markdown).toContain('### #1 Title generation request')
    expect(markdown).toContain('```text\nHello title\n```')
  })

  it('omits base64 payloads in formatted debug markdown while preserving data URL prefixes', () => {
    const base64 = 'A'.repeat(160)
    const trace = createTrace(
      JSON.stringify({
        output: [
          {
            type: 'image',
            data: base64,
          },
        ],
      }),
      'application/json',
    )
    trace.exchanges[0].request.body = JSON.stringify({
      image_url: `data:image/jpeg;base64,${base64}`,
      input: [
        {
          type: 'input_image',
          image_url: `data:image/png;base64,${base64}`,
        },
      ],
    })

    const markdown = buildLLMDebugMarkdown([trace])

    expect(markdown).toContain(
      'data:image/jpeg;base64,[OMITTED base64 data: 160 chars]',
    )
    expect(markdown).toContain(
      'data:image/png;base64,[OMITTED base64 data: 160 chars]',
    )
    expect(markdown).toContain('"data": "[OMITTED base64 data: 160 chars]"')
    expect(markdown).not.toContain(`base64,${base64}`)
  })
})
