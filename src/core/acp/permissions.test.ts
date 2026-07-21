import type { RequestPermissionRequest } from '@agentclientprotocol/sdk'

import { PermissionManager } from './permissions'

const options = [
  { optionId: 'once', kind: 'allow_once' as const, name: 'Allow once' },
  { optionId: 'always', kind: 'allow_always' as const, name: 'Always allow' },
  { optionId: 'reject', kind: 'reject_once' as const, name: 'Reject' },
]

function makeRequest(
  sessionId = 's1',
  toolCallId = 't1',
): RequestPermissionRequest {
  return {
    sessionId,
    toolCall: { toolCallId, title: 'edit', kind: 'edit' },
    options,
  }
}

const noopHooks = {
  onPending: () => undefined,
  onSettled: () => undefined,
}

describe('PermissionManager', () => {
  it('auto-approves with allow_once when enabled', async () => {
    const manager = new PermissionManager(() => true)
    const response = await manager.handleRequest(makeRequest(), noopHooks)
    expect(response).toEqual({
      outcome: { outcome: 'selected', optionId: 'once' },
    })
  })

  it('waits for user response when auto-approve is off', async () => {
    const manager = new PermissionManager(() => false)
    const captured: RequestPermissionRequest[] = []
    const promise = manager.handleRequest(makeRequest(), {
      onPending: (params) => {
        captured.push(params)
      },
      onSettled: () => undefined,
    })
    expect(captured[0]?.toolCall.toolCallId).toBe('t1')
    expect(manager.hasPending('t1')).toBe(true)

    const resolved = manager.respond('t1', 'always')
    expect(resolved).toBe(true)
    await expect(promise).resolves.toEqual({
      outcome: { outcome: 'selected', optionId: 'always' },
    })
    expect(manager.hasPending('t1')).toBe(false)
  })

  it('cancels pending requests for a session', async () => {
    const manager = new PermissionManager(() => false)
    const promise = manager.handleRequest(makeRequest('s1', 't1'), noopHooks)
    manager.cancelSession('s1')
    await expect(promise).resolves.toEqual({
      outcome: { outcome: 'cancelled' },
    })
  })

  it('cancelAll resolves every pending request', async () => {
    const manager = new PermissionManager(() => false)
    const p1 = manager.handleRequest(makeRequest('s1', 't1'), noopHooks)
    const p2 = manager.handleRequest(makeRequest('s2', 't2'), noopHooks)
    manager.cancelAll()
    await expect(p1).resolves.toEqual({ outcome: { outcome: 'cancelled' } })
    await expect(p2).resolves.toEqual({ outcome: { outcome: 'cancelled' } })
  })

  it('respond returns false for unknown toolCallId', () => {
    const manager = new PermissionManager(() => false)
    expect(manager.respond('nope', 'once')).toBe(false)
  })
})
