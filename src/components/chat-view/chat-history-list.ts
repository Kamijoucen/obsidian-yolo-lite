import type { ChatConversationMetadata } from '../../database/json/chat/types'

export function partitionChatHistory({
  chatList,
  currentConversationId,
  useArchive,
  recentLimit = 50,
}: {
  chatList: ChatConversationMetadata[]
  currentConversationId: string
  useArchive: boolean
  recentLimit?: number
}): {
  activeChatList: ChatConversationMetadata[]
  archivedChatList: ChatConversationMetadata[]
} {
  if (!useArchive) {
    return { activeChatList: chatList, archivedChatList: [] }
  }

  const pinnedChats = chatList.filter((chat) => chat.isPinned)
  const nonPinnedChats = chatList.filter((chat) => !chat.isPinned)
  const activeNonPinnedChats = nonPinnedChats.slice(0, recentLimit)
  const archivedNonPinnedChats = nonPinnedChats.slice(recentLimit)
  const currentArchivedIndex = archivedNonPinnedChats.findIndex(
    (chat) => chat.id === currentConversationId,
  )
  if (currentArchivedIndex !== -1) {
    const [currentConversation] = archivedNonPinnedChats.splice(
      currentArchivedIndex,
      1,
    )
    if (currentConversation) {
      activeNonPinnedChats.push(currentConversation)
    }
  }

  return {
    activeChatList: [...pinnedChats, ...activeNonPinnedChats],
    archivedChatList: archivedNonPinnedChats,
  }
}
