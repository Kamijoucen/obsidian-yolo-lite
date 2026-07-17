import { memo, useRef } from 'react'

import { ObsidianMarkdown } from './ObsidianMarkdown'
import StreamingMarkdown from './StreamingMarkdown'

type GenerationState = 'streaming' | 'completed' | 'aborted' | 'error'

const TransitioningMarkdown = memo(function TransitioningMarkdown({
  content,
  scale = 'base',
  generationState,
}: {
  content: string
  scale?: 'xs' | 'sm' | 'base'
  generationState?: GenerationState
}) {
  const hasStreamed = useRef(false)
  const isStreaming = generationState === 'streaming'

  if (isStreaming) {
    hasStreamed.current = true
    return (
      <StreamingMarkdown
        content={content}
        scale={scale}
        animateIncrementalText
      />
    )
  }

  const initialFallback = hasStreamed.current ? (
    <StreamingMarkdown content={content} scale={scale} />
  ) : undefined

  return (
    <ObsidianMarkdown
      content={content}
      scale={scale}
      initialFallback={initialFallback}
    />
  )
})

export default TransitioningMarkdown
