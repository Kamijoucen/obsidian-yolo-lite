import type { ChatConversationMetadata } from '../../database/json/chat/types'

import { partitionChatHistory } from './chat-history-list'

const chat = (
  id: string,
  updatedAt: number,
  isPinned = false,
): ChatConversationMetadata => ({
  id,
  title: id,
  updatedAt,
  schemaVersion: 1,
  isPinned,
})

describe('partitionChatHistory', () => {
  it('keeps pinned and recent conversations active', () => {
    const result = partitionChatHistory({
      chatList: [chat('pinned', 4, true), chat('a', 3), chat('b', 2)],
      currentConversationId: 'a',
      useArchive: true,
      recentLimit: 1,
    })
    expect(result.activeChatList.map((item) => item.id)).toEqual([
      'pinned',
      'a',
    ])
    expect(result.archivedChatList.map((item) => item.id)).toEqual(['b'])
  })
})
