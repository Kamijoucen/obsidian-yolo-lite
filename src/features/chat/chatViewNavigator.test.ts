import type { WorkspaceLeaf } from 'obsidian'

import { ChatView } from '../../ChatView'
import { CHAT_VIEW_TYPE } from '../../constants'
import type YoloPlugin from '../../main'

import { ChatViewNavigator } from './chatViewNavigator'

jest.mock('../../ChatView', () => ({
  ChatView: jest.fn().mockImplementation(function MockChatView() {}),
}))

const createPlugin = (overrides: {
  getRightLeaf?: () => WorkspaceLeaf
  getLeaf?: jest.Mock
  setPendingPayload?: jest.Mock
  registerLeaf?: jest.Mock
}) => {
  const sessionManager = {
    resolveTargetLeaf: () => null,
    setPendingPayload: overrides.setPendingPayload ?? jest.fn(),
    registerLeaf: overrides.registerLeaf ?? jest.fn(),
    touchLeafInteracted: jest.fn(),
    getLeafPlacement: jest.fn(() => 'sidebar'),
    inferLeafPlacement: jest.fn(() => 'sidebar'),
  }
  return {
    app: {
      workspace: {
        revealLeaf: jest.fn().mockResolvedValue(undefined),
        getActiveViewOfType: jest.fn(() => null),
        getRightLeaf: overrides.getRightLeaf,
        getLeaf: overrides.getLeaf,
      },
    },
    settings: { chatOptions: { lastChatPlacement: 'sidebar' } },
    setSettings: jest.fn().mockResolvedValue(undefined),
    getChatLeafSessionManager: () => sessionManager,
  } as unknown as YoloPlugin
}

describe('ChatViewNavigator', () => {
  it('stores the initial conversation id in a new sidebar view', async () => {
    const setViewState = jest.fn().mockResolvedValue(undefined)
    const leaf = {
      setViewState,
      view: Object.create(ChatView.prototype),
    } as unknown as WorkspaceLeaf
    const navigator = new ChatViewNavigator({
      plugin: createPlugin({ getRightLeaf: () => leaf }),
    })

    await navigator.openChatView({
      placement: 'sidebar',
      initialConversationId: 'conversation-1',
    })

    expect(setViewState).toHaveBeenCalledWith({
      type: CHAT_VIEW_TYPE,
      active: true,
      state: { currentConversationId: 'conversation-1' },
    })
  })

  it('asks Obsidian for a split leaf when opening a split chat', async () => {
    const setViewState = jest.fn().mockResolvedValue(undefined)
    const leaf = {
      setViewState,
      view: Object.create(ChatView.prototype),
    } as unknown as WorkspaceLeaf
    const getLeaf = jest.fn(() => leaf)
    const setPendingPayload = jest.fn()
    const registerLeaf = jest.fn()
    const navigator = new ChatViewNavigator({
      plugin: createPlugin({ getLeaf, setPendingPayload, registerLeaf }),
    })

    await navigator.openChatInSplit(true)

    expect(getLeaf).toHaveBeenCalledWith('split')
    expect(setPendingPayload).toHaveBeenCalledWith(
      leaf,
      expect.objectContaining({ placement: 'split' }),
    )
    expect(registerLeaf).toHaveBeenCalledWith(leaf, 'split')
  })
})
