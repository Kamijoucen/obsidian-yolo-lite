import { App, normalizePath } from 'obsidian'

import {
  getLiteSkillDocument,
  getLiteSkillDocumentByPath,
  getSkillScanDirs,
  humanizeSkillName,
  listLiteSkillEntries,
} from './liteSkills'

const OBSIDIAN_CONFIG_DIR = ['.', 'obsidian'].join('')

type AdapterDirListing = {
  files: string[]
  folders: string[]
}

const makeAdapterApp = ({
  listings,
  fileContents,
  fileFrontmatter = {},
  fileByPath = {},
}: {
  listings: Record<string, AdapterDirListing>
  fileContents: Record<string, string>
  fileFrontmatter?: Record<string, Record<string, unknown>>
  fileByPath?: Record<string, { path: string; name: string; extension: string }>
}): App => {
  const reads = { ...fileContents }
  const writes: Array<{ path: string; content: string }> = []

  const adapter = {
    exists: (path: string) =>
      Promise.resolve(Boolean(listings[normalizePath(path)])),
    list: (path: string) => {
      const listing = listings[normalizePath(path)]
      if (!listing) {
        return Promise.resolve({ files: [], folders: [] })
      }
      return Promise.resolve({
        files: listing.files.map((file) => normalizePath(file)),
        folders: listing.folders.map((folder) => normalizePath(folder)),
      })
    },
    read: (path: string) => Promise.resolve(reads[normalizePath(path)] ?? ''),
    write: (path: string, content: string) => {
      const normalized = normalizePath(path)
      reads[normalized] = content
      writes.push({ path: normalized, content })
      return Promise.resolve()
    },
  }

  const app = {
    vault: {
      configDir: OBSIDIAN_CONFIG_DIR,
      adapter,
      getFileByPath: (path: string) => fileByPath[normalizePath(path)] ?? null,
      cachedRead: (file: { path: string }) =>
        Promise.resolve(reads[normalizePath(file.path)] ?? ''),
      read: (file: { path: string }) =>
        Promise.resolve(reads[normalizePath(file.path)] ?? ''),
      modify: (file: { path: string }, content: string) => {
        const normalized = normalizePath(file.path)
        reads[normalized] = content
        writes.push({ path: normalized, content })
        return Promise.resolve()
      },
    },
    metadataCache: {
      getFileCache: (file: { path: string }) => ({
        frontmatter: fileFrontmatter[normalizePath(file.path)],
      }),
    },
  } as unknown as App

  return app
}

describe('getSkillScanDirs', () => {
  it('deduplicates the default skills dir when it matches a hidden root', () => {
    expect(
      getSkillScanDirs({
        settings: { yolo: { baseDir: `${OBSIDIAN_CONFIG_DIR}/yolo` } },
        configDir: OBSIDIAN_CONFIG_DIR,
      }),
    ).toEqual([
      `${OBSIDIAN_CONFIG_DIR}/yolo/skills`,
      `${OBSIDIAN_CONFIG_DIR}/skills`,
      `${OBSIDIAN_CONFIG_DIR}/YOLO/skills`,
    ])
  })
})

describe('listLiteSkillEntries and getLiteSkillDocument', () => {
  const settings = { yolo: { baseDir: 'YOLO' } }

  it('lists default-dir and hidden-dir skills via adapter scan', async () => {
    const app = makeAdapterApp({
      listings: {
        'YOLO/skills': {
          files: ['YOLO/skills/default-skill.md'],
          folders: [],
        },
        [`${OBSIDIAN_CONFIG_DIR}/skills`]: {
          files: [`${OBSIDIAN_CONFIG_DIR}/skills/hidden-skill.md`],
          folders: [],
        },
      },
      fileContents: {
        'YOLO/skills/default-skill.md': [
          '---',
          'name: default-skill',
          'description: from default dir',
          '---',
          '',
        ].join('\n'),
        [`${OBSIDIAN_CONFIG_DIR}/skills/hidden-skill.md`]: [
          '---',
          'name: hidden-skill',
          'description: from hidden dir',
          '---',
          '',
        ].join('\n'),
      },
    })

    const entries = await listLiteSkillEntries(app, { settings })
    const names = entries.map((entry) => entry.name)

    expect(names).toContain('default-skill')
    expect(names).toContain('hidden-skill')
  })

  it('discovers Claude-style SKILL.md under hidden directories', async () => {
    const app = makeAdapterApp({
      listings: {
        'YOLO/skills': { files: [], folders: [] },
        [`${OBSIDIAN_CONFIG_DIR}/skills`]: {
          files: [],
          folders: [`${OBSIDIAN_CONFIG_DIR}/skills/claude-skill`],
        },
        [`${OBSIDIAN_CONFIG_DIR}/skills/claude-skill`]: {
          files: [`${OBSIDIAN_CONFIG_DIR}/skills/claude-skill/SKILL.md`],
          folders: [],
        },
      },
      fileContents: {
        [`${OBSIDIAN_CONFIG_DIR}/skills/claude-skill/SKILL.md`]: [
          '---',
          'name: claude-skill',
          'description: nested skill',
          '---',
          '',
        ].join('\n'),
      },
    })

    const entries = await listLiteSkillEntries(app, { settings })
    expect(entries.map((entry) => entry.name)).toContain('claude-skill')
  })

  it('prefers the default skills dir over hidden dirs for duplicate names', async () => {
    const app = makeAdapterApp({
      listings: {
        'YOLO/skills': {
          files: ['YOLO/skills/shared-skill.md'],
          folders: [],
        },
        [`${OBSIDIAN_CONFIG_DIR}/skills`]: {
          files: [`${OBSIDIAN_CONFIG_DIR}/skills/shared-skill.md`],
          folders: [],
        },
      },
      fileContents: {
        'YOLO/skills/shared-skill.md': [
          '---',
          'name: shared-skill',
          'description: default wins',
          '---',
          '',
        ].join('\n'),
        [`${OBSIDIAN_CONFIG_DIR}/skills/shared-skill.md`]: [
          '---',
          'name: shared-skill',
          'description: hidden loses',
          '---',
          '',
        ].join('\n'),
      },
    })

    const entries = await listLiteSkillEntries(app, { settings })
    const shared = entries.find((entry) => entry.name === 'shared-skill')

    expect(shared?.path).toBe('YOLO/skills/shared-skill.md')
    expect(shared?.description).toBe('default wins')
  })

  it('uses path order within the same directory for duplicate names', async () => {
    const app = makeAdapterApp({
      listings: {
        'YOLO/skills': {
          files: ['YOLO/skills/b-skill.md', 'YOLO/skills/a-skill.md'],
          folders: [],
        },
        [`${OBSIDIAN_CONFIG_DIR}/skills`]: { files: [], folders: [] },
      },
      fileContents: {
        'YOLO/skills/a-skill.md': [
          '---',
          'name: same-name',
          'description: first by path',
          '---',
          '',
        ].join('\n'),
        'YOLO/skills/b-skill.md': [
          '---',
          'name: same-name',
          'description: second by path',
          '---',
          '',
        ].join('\n'),
      },
    })

    const entries = await listLiteSkillEntries(app, { settings })
    const winner = entries.find((entry) => entry.name === 'same-name')

    expect(winner?.path).toBe('YOLO/skills/a-skill.md')
    expect(winner?.description).toBe('first by path')
  })

  it('opens a hidden-directory skill through the shared registry', async () => {
    const content = [
      '---',
      'name: hidden-open',
      'description: hidden body',
      '---',
      '# Hidden body',
    ].join('\n')
    const app = makeAdapterApp({
      listings: {
        'YOLO/skills': { files: [], folders: [] },
        [`${OBSIDIAN_CONFIG_DIR}/skills`]: {
          files: [`${OBSIDIAN_CONFIG_DIR}/skills/hidden-open.md`],
          folders: [],
        },
      },
      fileContents: {
        [`${OBSIDIAN_CONFIG_DIR}/skills/hidden-open.md`]: content,
      },
    })

    const document = await getLiteSkillDocument({
      app,
      name: 'hidden-open',
      settings,
    })

    expect(document?.entry.path).toBe(
      `${OBSIDIAN_CONFIG_DIR}/skills/hidden-open.md`,
    )
    expect(document?.content).toBe(content)
  })

  it('resolves builtin skill documents by canonical path', async () => {
    const app = makeAdapterApp({
      listings: {
        'YOLO/skills': { files: [], folders: [] },
      },
      fileContents: {},
    })

    const document = await getLiteSkillDocumentByPath({
      app,
      path: 'builtin://skills/skill-creator.md',
      settings,
    })

    expect(document?.entry.name).toBe('skill-creator')
    expect(document?.content).toContain('YOLO/skills')
  })
})

describe('humanizeSkillName', () => {
  it('converts kebab-case to Title Case', () => {
    expect(humanizeSkillName('english-polisher')).toBe('English Polisher')
    expect(humanizeSkillName('skill-creator')).toBe('Skill Creator')
  })

  it('handles single words and underscores/spaces', () => {
    expect(humanizeSkillName('notes')).toBe('Notes')
    expect(humanizeSkillName('meeting_notes')).toBe('Meeting Notes')
    expect(humanizeSkillName('  spaced  name ')).toBe('Spaced Name')
  })

  it('returns empty string for empty input', () => {
    expect(humanizeSkillName('')).toBe('')
    expect(humanizeSkillName('   ')).toBe('')
  })
})
