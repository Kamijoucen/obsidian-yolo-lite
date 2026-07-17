import { Platform } from 'obsidian'

import { RequestTransportMode } from '../../types/provider.types'

type RequestTransportSettings = {
  requestTransportMode?: {
    desktop?: RequestTransportMode
    mobile?: Extract<RequestTransportMode, 'browser' | 'obsidian'>
  }
}

const normalizeStoredRequestTransportMode = (
  mode: RequestTransportSettings['requestTransportMode'],
): RequestTransportMode | undefined => {
  if (mode) {
    const platformMode = Platform.isDesktop ? mode.desktop : mode.mobile
    if (
      platformMode === 'browser' ||
      platformMode === 'obsidian' ||
      (Platform.isDesktop && platformMode === 'node')
    ) {
      return platformMode
    }
    return undefined
  }

  return undefined
}

export const resolveRequestTransportMode = ({
  additionalSettings,
}: {
  additionalSettings?: RequestTransportSettings
}): RequestTransportMode => {
  const configuredMode = normalizeStoredRequestTransportMode(
    additionalSettings?.requestTransportMode,
  )
  if (configuredMode) {
    return configuredMode
  }

  return Platform.isDesktop ? 'node' : 'browser'
}

export const runWithRequestTransport = async <T>({
  mode,
  runBrowser,
  runObsidian,
  runNode,
}: {
  mode: RequestTransportMode
  runBrowser: () => Promise<T>
  runObsidian: () => Promise<T>
  runNode?: () => Promise<T>
}): Promise<T> => {
  if (mode === 'browser') {
    return runBrowser()
  }

  if (mode === 'obsidian') {
    return runObsidian()
  }

  if (mode === 'node') {
    if (!runNode) {
      throw new Error('Node request transport is not configured.')
    }
    return runNode()
  }

  throw new Error(`Unsupported request transport mode: ${String(mode)}`)
}

const createMobileBrowserStreamWithSuggestion = <T>(
  stream: AsyncIterable<T>,
): AsyncIterable<T> => {
  return {
    async *[Symbol.asyncIterator]() {
      try {
        for await (const chunk of stream) {
          yield chunk
        }
      } catch (error) {
        throw appendMobileBrowserTransportSuggestion(error)
      }
    },
  }
}

const appendMobileBrowserTransportSuggestion = (error: unknown): Error => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown request transport error'
  return new Error(
    `${message}\n\nBrowser requests on mobile may not support this provider's streaming response. Switch this provider's network request method to Obsidian built-in request and try again.`,
  )
}

export const runWithRequestTransportForStream = async <T>({
  mode,
  createBrowserStream,
  createObsidianStream,
  createNodeStream,
  signal,
}: {
  mode: RequestTransportMode
  createBrowserStream: (signal?: AbortSignal) => Promise<AsyncIterable<T>>
  createObsidianStream: (signal?: AbortSignal) => Promise<AsyncIterable<T>>
  createNodeStream?: (signal?: AbortSignal) => Promise<AsyncIterable<T>>
  signal?: AbortSignal
}): Promise<AsyncIterable<T>> => {
  if (mode === 'browser') {
    try {
      const stream = await createBrowserStream(signal)
      return Platform.isDesktop
        ? stream
        : createMobileBrowserStreamWithSuggestion(stream)
    } catch (error) {
      if (!Platform.isDesktop) {
        throw appendMobileBrowserTransportSuggestion(error)
      }
      throw error
    }
  }

  if (mode === 'obsidian') {
    return createObsidianStream(signal)
  }

  if (mode === 'node') {
    if (!createNodeStream) {
      throw new Error('Node request transport is not configured.')
    }
    return createNodeStream(signal)
  }

  throw new Error(`Unsupported request transport mode: ${String(mode)}`)
}
