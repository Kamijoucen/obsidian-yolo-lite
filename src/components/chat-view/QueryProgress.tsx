import DotLoader from '../common/DotLoader'

export type QueryProgressState =
  | {
      type: 'reading-mentionables'
    }
  | {
      type: 'idle'
    }

// TODO: Update style
export default function QueryProgress({
  state,
}: {
  state: QueryProgressState
}) {
  switch (state.type) {
    case 'idle':
      return null
    case 'reading-mentionables':
      return (
        <div className="yolo-query-progress">
          <p>
            Reading mentioned files
            <DotLoader variant="dots" />
          </p>
        </div>
      )
  }
}
