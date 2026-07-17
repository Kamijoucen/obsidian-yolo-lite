import { App, normalizePath } from 'obsidian'

import { getYoloBaseDir, getYoloJsonDbRootDir } from './yoloPaths'

export type YoloSettingsLike = {
  yolo?: {
    baseDir?: string
  }
}

export const YOLO_DATA_META_KEY = '__meta'

export type YoloDataMeta = {
  updatedAt: number
  deviceId: string
}

export type YoloDataReadResult = {
  raw: Record<string, unknown>
  meta: YoloDataMeta | null
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export const extractYoloDataMeta = (
  raw: unknown,
): YoloDataReadResult | null => {
  if (!isPlainObject(raw)) return null

  const candidate = raw[YOLO_DATA_META_KEY]
  const meta =
    isPlainObject(candidate) &&
    typeof candidate.updatedAt === 'number' &&
    typeof candidate.deviceId === 'string'
      ? {
          updatedAt: candidate.updatedAt,
          deviceId: candidate.deviceId,
        }
      : null
  const { [YOLO_DATA_META_KEY]: _ignored, ...settings } = raw
  return { raw: settings, meta }
}

export const stampYoloDataMeta = (
  data: unknown,
  meta: YoloDataMeta,
): Record<string, unknown> => ({
  ...(isPlainObject(data) ? data : {}),
  [YOLO_DATA_META_KEY]: meta,
})

const ensureDir = async (app: App, path: string): Promise<void> => {
  try {
    await app.vault.adapter.mkdir(path)
  } catch (error) {
    if (!(await app.vault.adapter.exists(path))) throw error
  }
}

const ensureParentDir = async (app: App, path: string): Promise<void> => {
  const normalized = normalizePath(path)
  const separator = normalized.lastIndexOf('/')
  if (separator > 0) await ensureDir(app, normalized.slice(0, separator))
}

const copyDirectory = async (
  app: App,
  sourceDir: string,
  targetDir: string,
): Promise<void> => {
  await ensureDir(app, targetDir)
  const listing = await app.vault.adapter.list(sourceDir)

  for (const sourcePath of listing.files) {
    const targetPath = normalizePath(
      `${targetDir}/${sourcePath.slice(sourceDir.length + 1)}`,
    )
    if (await app.vault.adapter.exists(targetPath)) continue
    await ensureParentDir(app, targetPath)
    await app.vault.adapter.writeBinary(
      targetPath,
      await app.vault.adapter.readBinary(sourcePath),
    )
  }

  for (const sourcePath of listing.folders) {
    await copyDirectory(
      app,
      sourcePath,
      normalizePath(`${targetDir}/${sourcePath.slice(sourceDir.length + 1)}`),
    )
  }
}

const removeDirectory = async (app: App, dir: string): Promise<void> => {
  if (!(await app.vault.adapter.exists(dir))) return
  const listing = await app.vault.adapter.list(dir)
  for (const file of listing.files) await app.vault.adapter.remove(file)
  for (const folder of listing.folders) await removeDirectory(app, folder)
  await app.vault.adapter.rmdir(dir, false)
}

export const ensureJsonDbRootDir = async (
  app: App,
  settings: YoloSettingsLike | null,
): Promise<string> => {
  await ensureDir(app, getYoloBaseDir(settings))
  const root = getYoloJsonDbRootDir(settings)
  await ensureDir(app, root)
  return root
}

export const ensureLearningJsonDbRootDir = ensureJsonDbRootDir

export const relocateYoloManagedData = async ({
  app,
  fromSettings,
  toSettings,
}: {
  app: App
  fromSettings?: YoloSettingsLike | null
  toSettings?: YoloSettingsLike | null
}): Promise<boolean> => {
  const source = getYoloJsonDbRootDir(fromSettings)
  const target = getYoloJsonDbRootDir(toSettings)
  if (source === target) return true
  if (target.startsWith(`${source}/`)) {
    console.warn(
      `[YOLO] Refusing to move managed data into its own source tree: "${target}".`,
    )
    return false
  }
  if (!(await app.vault.adapter.exists(source))) {
    await ensureJsonDbRootDir(app, toSettings ?? null)
    return true
  }

  try {
    await ensureDir(app, getYoloBaseDir(toSettings))
    await copyDirectory(app, source, target)
    await removeDirectory(app, source)
    return true
  } catch (error) {
    console.warn(
      `[YOLO] Failed to move managed data from "${source}" to "${target}".`,
      error,
    )
    return false
  }
}
