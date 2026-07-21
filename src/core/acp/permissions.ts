import type {
  RequestPermissionRequest,
  RequestPermissionResponse,
} from '@agentclientprotocol/sdk'

export type PermissionRespondHook = {
  onPending: (params: RequestPermissionRequest) => void
  onSettled: (toolCallId: string) => void
}

type PendingEntry = {
  sessionId: string
  resolve: (response: RequestPermissionResponse) => void
}

function selectedResponse(optionId: string): RequestPermissionResponse {
  return { outcome: { outcome: 'selected', optionId } }
}

function cancelledResponse(): RequestPermissionResponse {
  return { outcome: { outcome: 'cancelled' } }
}

function pickAutoApproveOption(
  options: RequestPermissionRequest['options'],
): string | null {
  const allowOnce = options.find((option) => option.kind === 'allow_once')
  return (allowOnce ?? options[0])?.optionId ?? null
}

export class PermissionManager {
  private pending = new Map<string, PendingEntry>()

  constructor(private readonly autoApprove: () => boolean) {}

  handleRequest(
    params: RequestPermissionRequest,
    hooks: PermissionRespondHook,
  ): Promise<RequestPermissionResponse> {
    const toolCallId = params.toolCall.toolCallId
    if (this.autoApprove()) {
      const optionId = pickAutoApproveOption(params.options)
      if (optionId) {
        return Promise.resolve(selectedResponse(optionId))
      }
    }
    hooks.onPending(params)
    return new Promise<RequestPermissionResponse>((resolve) => {
      this.pending.set(toolCallId, {
        sessionId: params.sessionId,
        resolve: (response) => {
          hooks.onSettled(toolCallId)
          resolve(response)
        },
      })
    })
  }

  respond(toolCallId: string, optionId: string): boolean {
    const entry = this.pending.get(toolCallId)
    if (!entry) return false
    this.pending.delete(toolCallId)
    entry.resolve(selectedResponse(optionId))
    return true
  }

  cancelSession(sessionId: string): void {
    for (const [toolCallId, entry] of [...this.pending.entries()]) {
      if (entry.sessionId !== sessionId) continue
      this.pending.delete(toolCallId)
      entry.resolve(cancelledResponse())
    }
  }

  cancelAll(): void {
    for (const [toolCallId, entry] of [...this.pending.entries()]) {
      this.pending.delete(toolCallId)
      entry.resolve(cancelledResponse())
    }
  }

  hasPending(toolCallId: string): boolean {
    return this.pending.has(toolCallId)
  }
}
