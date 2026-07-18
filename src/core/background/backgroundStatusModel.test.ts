import type { BackgroundActivity } from './backgroundActivityRegistry'
import { buildBackgroundStatusModel } from './backgroundStatusModel'

function activity(
  id: string,
  status: BackgroundActivity['status'],
): BackgroundActivity {
  return {
    id,
    kind: 'agent',
    title: id,
    status,
    updatedAt: 0,
  }
}

describe('buildBackgroundStatusModel', () => {
  it('hides when there are no activities', () => {
    expect(buildBackgroundStatusModel([])).toEqual({
      activities: [],
      tone: null,
      visible: false,
    })
  })

  it('keeps activity priority', () => {
    const model = buildBackgroundStatusModel([
      activity('failed', 'failed'),
      activity('running-b', 'running'),
      activity('waiting', 'waiting'),
      activity('running-a', 'running'),
    ])

    expect(model.activities.map(({ id }) => id)).toEqual([
      'waiting',
      'running-a',
      'running-b',
      'failed',
    ])
    expect(model.tone).toBe('running')
  })

  it('uses the highest-priority visible activity tone', () => {
    expect(
      buildBackgroundStatusModel([
        activity('failed', 'failed'),
        activity('waiting', 'waiting'),
      ]).tone,
    ).toBe('waiting')
  })
})
