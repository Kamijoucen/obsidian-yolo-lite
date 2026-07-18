import type { CSSProperties, ReactNode, RefObject } from 'react'

import type { ChatTimelineItem } from '../../types/chat-timeline'

import {
  ChatTimelineList,
  type ChatTimelineRenderContext,
  type ChatTimelineRenderVersion,
  type UserMessageViewportState,
} from './ChatTimelineList'

type SharedConversationSurfaceProps<TItem extends ChatTimelineItem> = {
  items: TItem[]
  scrollContainerRef: RefObject<HTMLElement>
  onScrollContainerChange?: (element: HTMLElement | null) => void
  onContentElementChange?: (element: HTMLElement | null) => void
  renderItem: (
    item: TItem,
    index: number,
    context?: ChatTimelineRenderContext,
  ) => ReactNode
  renderVersion?: ChatTimelineRenderVersion<TItem>
  onUserMessageViewportChange?: (state: UserMessageViewportState) => void
  windowNavigationKey?: number
  windowNavigationTargetMessageId?: string | null
  hasEarlierMessages?: boolean
  hasNewerMessages?: boolean
  onLoadEarlier?: () => void
  onLoadNewer?: () => void
  scrollContainerClassName?: string
  scrollContainerStyle?: CSSProperties
  containerClassName?: string
  containerStyle?: CSSProperties
  overlaySlot?: ReactNode
  extraSlot?: ReactNode
  extraSlotPosition?: 'before' | 'after'
  bottomSpacerHeight?: number
}

export function SharedConversationSurface<TItem extends ChatTimelineItem>({
  items,
  scrollContainerRef,
  onScrollContainerChange,
  onContentElementChange,
  renderItem,
  renderVersion,
  onUserMessageViewportChange,
  windowNavigationKey,
  windowNavigationTargetMessageId,
  hasEarlierMessages,
  hasNewerMessages,
  onLoadEarlier,
  onLoadNewer,
  scrollContainerClassName,
  scrollContainerStyle,
  containerClassName,
  containerStyle,
  overlaySlot,
  extraSlot,
  extraSlotPosition = 'after',
  bottomSpacerHeight,
}: SharedConversationSurfaceProps<TItem>) {
  const timeline = (
    <ChatTimelineList
      items={items}
      scrollContainerRef={scrollContainerRef}
      onScrollContainerChange={onScrollContainerChange}
      onContentElementChange={onContentElementChange}
      renderItem={renderItem}
      renderVersion={renderVersion}
      onUserMessageViewportChange={onUserMessageViewportChange}
      windowNavigationKey={windowNavigationKey}
      windowNavigationTargetMessageId={windowNavigationTargetMessageId}
      hasEarlierMessages={hasEarlierMessages}
      hasNewerMessages={hasNewerMessages}
      onLoadEarlier={onLoadEarlier}
      onLoadNewer={onLoadNewer}
      scrollContainerClassName={scrollContainerClassName}
      scrollContainerStyle={scrollContainerStyle}
      bottomSpacerHeight={bottomSpacerHeight}
    />
  )

  const hasOuterWrapper =
    Boolean(containerClassName) ||
    Boolean(containerStyle) ||
    overlaySlot !== undefined ||
    extraSlot !== undefined

  if (!hasOuterWrapper) {
    return timeline
  }

  return (
    <div className={containerClassName} style={containerStyle}>
      {overlaySlot}
      {extraSlotPosition === 'before' ? extraSlot : null}
      {timeline}
      {extraSlotPosition === 'after' ? extraSlot : null}
    </div>
  )
}
