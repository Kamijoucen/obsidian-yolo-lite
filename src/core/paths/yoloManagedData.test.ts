import type { App } from 'obsidian'

import {
  YOLO_DATA_META_KEY,
  ensureJsonDbRootDir,
  extractYoloDataMeta,
  relocateYoloManagedData,
  stampYoloDataMeta,
} from './yoloManagedData'

class MockAdapter {
  private readonly files = new Map<string, ArrayBuffer>()
  private readonly folders = new Set<string>()

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.folders.has(path)
  }

  async mkdir(path: string): Promise<void> {
    let current = ''
    for (const segment of path.split('/').filter(Boolean)) {
      current = current ? `${current}/${segment}` : segment
      this.folders.add(current)
    }
  }

  async list(path: string): Promise<{ files: string[]; folders: string[] }> {
    const prefix = `${path}/`
    return {
      files: [...this.files.keys()].filter(
        (candidate) =>
          candidate.startsWith(prefix) &&
          !candidate.slice(prefix.length).includes('/'),
      ),
      folders: [...this.folders].filter(
        (candidate) =>
          candidate !== path &&
          candidate.startsWith(prefix) &&
          !candidate.slice(prefix.length).includes('/'),
      ),
    }
  }

  async readBinary(path: string): Promise<ArrayBuffer> {
    const value = this.files.get(path)
    if (!value) throw new Error(`Missing file: ${path}`)
    return value
  }

  async writeBinary(path: string, value: ArrayBuffer): Promise<void> {
    await this.ensureParent(path)
    this.files.set(path, value)
  }

  async remove(path: string): Promise<void> {
    this.files.delete(path)
  }

  async rmdir(path: string): Promise<void> {
    this.folders.delete(path)
  }

  async putText(path: string, value: string): Promise<void> {
    const bytes = new TextEncoder().encode(value)
    await this.writeBinary(
      path,
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    )
  }

  async readText(path: string): Promise<string> {
    return new TextDecoder().decode(await this.readBinary(path))
  }

  private async ensureParent(path: string): Promise<void> {
    const index = path.lastIndexOf('/')
    if (index > 0) await this.mkdir(path.slice(0, index))
  }
}

const createApp = (adapter: MockAdapter): App =>
  ({ vault: { adapter } }) as unknown as App

describe('yoloManagedData', () => {
  it('extracts and stamps settings metadata', () => {
    const meta = { updatedAt: 42, deviceId: 'device-1' }
    const stamped = stampYoloDataMeta({ version: 1 }, meta)

    expect(stamped[YOLO_DATA_META_KEY]).toEqual(meta)
    expect(extractYoloDataMeta(stamped)).toEqual({
      raw: { version: 1 },
      meta,
    })
  })

  it('creates the configured JSON data root', async () => {
    const adapter = new MockAdapter()
    const app = createApp(adapter)

    await expect(
      ensureJsonDbRootDir(app, { yolo: { baseDir: 'Config/YOLO' } }),
    ).resolves.toBe('Config/YOLO/.yolo_json_db')
    await expect(adapter.exists('Config/YOLO/.yolo_json_db')).resolves.toBe(
      true,
    )
  })

  it('moves current managed data when the configured root changes', async () => {
    const adapter = new MockAdapter()
    const app = createApp(adapter)
    await adapter.putText(
      'YOLO/.yolo_json_db/chats/v1_chat.json',
      '{"id":"chat"}',
    )
    await adapter.putText(
      'Config/YOLO/.yolo_json_db/chats/target.json',
      '{"id":"target"}',
    )

    await expect(
      relocateYoloManagedData({
        app,
        fromSettings: { yolo: { baseDir: 'YOLO' } },
        toSettings: { yolo: { baseDir: 'Config/YOLO' } },
      }),
    ).resolves.toBe(true)

    await expect(
      adapter.readText('Config/YOLO/.yolo_json_db/chats/v1_chat.json'),
    ).resolves.toBe('{"id":"chat"}')
    await expect(
      adapter.readText('Config/YOLO/.yolo_json_db/chats/target.json'),
    ).resolves.toBe('{"id":"target"}')
    await expect(adapter.exists('YOLO/.yolo_json_db')).resolves.toBe(false)
  })

  it('refuses a target inside the current managed-data tree', async () => {
    const adapter = new MockAdapter()
    const app = createApp(adapter)
    await adapter.mkdir('YOLO/.yolo_json_db')

    await expect(
      relocateYoloManagedData({
        app,
        fromSettings: { yolo: { baseDir: 'YOLO' } },
        toSettings: { yolo: { baseDir: 'YOLO/.yolo_json_db/nested' } },
      }),
    ).resolves.toBe(false)
  })
})
