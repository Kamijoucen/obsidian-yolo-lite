import type { BackgroundActivity } from './backgroundActivityRegistry'

export type BackgroundStatusTone = 'running' | 'waiting' | 'failed'

export type BackgroundStatusModel = {
  activities: BackgroundActivity[]
  tone: BackgroundStatusTone | null
  visible: boolean
}

export function buildBackgroundStatusModel(
  activities: Iterable<BackgroundActivity>,
): BackgroundStatusModel {
  const visibleActivities = Array.from(activities)
    .filter(
      (activity) =>
        activity.status === 'running' ||
        activity.status === 'waiting' ||
        activity.status === 'failed',
    )
    .sort((left, right) => {
      const priorityDelta = priority(left) - priority(right)
      return priorityDelta || left.id.localeCompare(right.id)
    })
  let tone: BackgroundStatusTone | null = null
  if (visibleActivities.some((activity) => activity.status === 'running')) {
    tone = 'running'
  } else if (
    visibleActivities.some((activity) => activity.status === 'waiting')
  ) {
    tone = 'waiting'
  } else if (
    visibleActivities.some((activity) => activity.status === 'failed')
  ) {
    tone = 'failed'
  }

  return {
    activities: visibleActivities,
    tone,
    visible: visibleActivities.length > 0,
  }
}

function priority(activity: BackgroundActivity): number {
  if (activity.status === 'waiting') return 0
  if (activity.status === 'running') return 1
  return 2
}
