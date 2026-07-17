import { YoloSettings } from '../../settings/schema/setting.types'
import { ChatModel } from '../../types/chat-model.types'

import {
  LLMAPIKeyInvalidException,
  LLMAPIKeyNotSetException,
  LLMModelNotFoundException,
  LLMRateLimitExceededException,
} from './exception'
import { getProviderClient } from './manager'

export const HEALTH_CHECK_TIMEOUT_MS = 15000

export type HealthStatus = 'ok' | 'fail' | 'timeout'

export type HealthResult =
  | {
      status: 'ok'
      totalMs: number
      // chat metric: time-to-first-token
      firstTokenMs?: number
    }
  | { status: 'timeout'; totalMs: number }
  | { status: 'fail'; code?: number; message: string }

export type HealthCheckOptions = {
  signal: AbortSignal
  timeoutMs?: number
}

/**
 * Thrown when a health check is cancelled by the caller (stop button / unmount).
 * The hook layer discards these instead of writing a result, so a cancelled
 * model returns to its previous (idle) state rather than showing as failed.
 */
export class HealthCheckAbortedError extends Error {
  constructor() {
    super('Health check aborted')
    this.name = 'HealthCheckAbortedError'
  }
}

/**
 * Best-effort HTTP status extraction across provider and wrapped error shapes.
 */
function extractHttpStatus(error: unknown): number | undefined {
  const visited = new Set<unknown>()
  const visit = (value: unknown): number | undefined => {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return undefined
    }
    visited.add(value)
    const obj = value as Record<string, unknown>

    if (typeof obj.status === 'number') return obj.status
    if (typeof obj.statusCode === 'number') return obj.statusCode
    // `code` is only an HTTP status when numeric — some SDKs use string codes
    // like 'model_not_found', which we must not treat as a status.
    if (typeof obj.code === 'number') return obj.code

    return visit(obj.rawError) ?? visit(obj.cause)
  }
  return visit(error)
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (error && typeof error === 'object') {
    const name = (error as { name?: unknown }).name
    if (name === 'AbortError' || name === 'HealthCheckAbortedError') {
      return true
    }
  }
  return false
}

function mapErrorToResult(error: unknown): HealthResult {
  let code: number | undefined
  if (error instanceof LLMModelNotFoundException) {
    code = 404
  } else if (
    error instanceof LLMAPIKeyInvalidException ||
    error instanceof LLMAPIKeyNotSetException
  ) {
    code = 401
  } else if (error instanceof LLMRateLimitExceededException) {
    code = 429
  } else {
    code = extractHttpStatus(error)
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error)

  return { status: 'fail', code, message }
}

/**
 * Send a minimal streaming request to measure time-to-first-token (TTFT).
 *
 * We deliberately do NOT compute throughput (tok/s): a minimal probe generates
 * only a handful of tokens, and on buffered transports they all arrive at once,
 * so the decode window collapses toward zero and any tok/s figure is noise.
 * TTFT is the only streaming metric meaningful on such a probe.
 *
 * Timeout semantics are a flat total budget (default 15s) — unlike
 * single-turn.ts which clears its timeout after the first chunk. A health
 * check wants the whole request bounded.
 *
 * Cancellation note: most transports forward `signal` to the underlying
 * fetch/SDK, but Obsidian's `requestUrl`-based transport can only check abort
 * before/after a request — an in-flight request may keep running after stop().
 * The hook layer's run-id + controller-identity guard prevents such late
 * results from being written back.
 */
export async function testChatModelHealth(
  settings: YoloSettings,
  model: ChatModel,
  opts: HealthCheckOptions,
): Promise<HealthResult> {
  const timeoutMs = opts.timeoutMs ?? HEALTH_CHECK_TIMEOUT_MS
  const providerClient = getProviderClient({
    settings,
    providerId: model.providerId,
  })

  const controller = new AbortController()
  let timedOut = false
  const onExternalAbort = () => controller.abort()
  if (opts.signal.aborted) {
    controller.abort()
  } else {
    opts.signal.addEventListener('abort', onExternalAbort)
  }
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const start = performance.now()
  let firstTokenMs: number | undefined

  try {
    const stream = await providerClient.streamResponse(
      model,
      {
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        model: model.model,
        max_tokens: 16,
        stream: true,
      },
      { signal: controller.signal },
    )

    for await (const chunk of stream) {
      if (firstTokenMs === undefined) {
        // TTFT = time until the model emits its first token of any kind. For
        // reasoning models the first emitted token is a reasoning token, so we
        // must count `delta.reasoning` too — otherwise a small `max_tokens`
        // probe can be fully consumed by reasoning, never reach `content`, and
        // the row would inconsistently fall back to showing total time.
        const delta = chunk.choices?.[0]?.delta
        if (delta?.content || delta?.reasoning) {
          firstTokenMs = performance.now() - start
          // The auto-transport stream wrapper's teardown only removes its abort
          // listener; it does not cascade `iterator.return()` to the underlying
          // HTTP/SSE request. Abort explicitly (before break, while the linked
          // listener is still attached) so the in-flight request is cancelled
          // instead of running to completion in the background.
          controller.abort()
          break
        }
      }
    }

    const totalMs = performance.now() - start

    // Guard against false positives: if the stream completed without emitting
    // any content or reasoning tokens, report a failure instead of a
    // misleading 'ok'. This commonly happens when the base URL is missing a
    // path prefix (e.g. `/v1`) and the server returns an empty SSE stream.
    if (firstTokenMs === undefined) {
      return {
        status: 'fail',
        message:
          'No content received from the model — verify the API base URL (e.g. the `/v1` suffix) and that the endpoint returns a non-empty SSE stream.',
      }
    }

    return { status: 'ok', totalMs, firstTokenMs }
  } catch (error) {
    if (opts.signal.aborted && !timedOut) {
      throw new HealthCheckAbortedError()
    }
    if (timedOut) {
      return { status: 'timeout', totalMs: timeoutMs }
    }
    if (isAbortError(error)) {
      throw new HealthCheckAbortedError()
    }
    return mapErrorToResult(error)
  } finally {
    clearTimeout(timer)
    opts.signal.removeEventListener('abort', onExternalAbort)
  }
}
