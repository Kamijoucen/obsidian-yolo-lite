import type { TFile } from 'obsidian'

import type { Mentionable } from '../../types/mentionable'

import {
  deserializeMentionable,
  getBlockContentHash,
  getMentionableKey,
  serializeMentionable,
} from './mentionable'

function makeFile(path: string): TFile {
  // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- minimal test double
  return { path, name: path.split('/').pop() ?? path } as unknown as TFile
}

describe('mentionable serialization', () => {
  it('round-trips a Markdown block', () => {
    const file = makeFile('notes/example.md')
    const original: Mentionable = {
      type: 'block',
      content: 'Selected text',
      file,
      startLine: 4,
      endLine: 6,
    }

    const serialized = serializeMentionable(original)
    const restored = deserializeMentionable(serialized, {
      vault: { getFileByPath: () => file },
    } as never)

    expect(serialized).toMatchObject({
      type: 'block',
      file: 'notes/example.md',
      contentHash: getBlockContentHash('Selected text'),
    })
    expect(restored).toMatchObject(original)
    expect(getMentionableKey(serialized)).toBe(
      `block:notes/example.md:4:6:${getBlockContentHash('Selected text')}`,
    )
  })

  it('drops unknown persisted mentionable types', () => {
    expect(
      deserializeMentionable(
        { type: 'removed-feature' } as never,
        { vault: {} } as never,
      ),
    ).toBeNull()
  })
})
