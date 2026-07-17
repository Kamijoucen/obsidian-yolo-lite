import { normalizePath } from 'obsidian'

export const DEFAULT_YOLO_BASE_DIR = 'YOLO'
export const YOLO_SKILLS_SUBDIR = 'skills'
export const YOLO_SKILLS_INDEX_FILE_NAME = 'Skills.md'
export const YOLO_SNIPPETS_FILE_NAME = 'snippets.md'
export const YOLO_JSON_DB_DIR_NAME = '.yolo_json_db'
export const YOLO_LEARNING_SUBDIR = 'learning'
export const YOLO_LEARNING_SRS_DIR_NAME = 'learning-srs'
export const YOLO_ANKI_IMPORT_JOURNAL_DIR_NAME = 'anki-import-journals'

type YoloSettingsLike = {
  yolo?: {
    baseDir?: string
  }
}

export const normalizeVaultRelativeDir = (
  value: string | undefined,
): string => {
  const normalized = normalizePath((value ?? '').trim())
    .replace(/^(\.\/)+/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  if (
    normalized.length === 0 ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    normalized.endsWith('/..')
  ) {
    return DEFAULT_YOLO_BASE_DIR
  }

  return normalized
}

export const getYoloBaseDir = (settings?: YoloSettingsLike | null): string => {
  return normalizeVaultRelativeDir(settings?.yolo?.baseDir)
}

export const getYoloSkillsDir = (
  settings?: YoloSettingsLike | null,
): string => {
  return normalizePath(`${getYoloBaseDir(settings)}/${YOLO_SKILLS_SUBDIR}`)
}

export const getYoloSkillsDirPrefix = (
  settings?: YoloSettingsLike | null,
): string => {
  return `${getYoloSkillsDir(settings)}/`
}

export const getYoloSkillsIndexPath = (
  settings?: YoloSettingsLike | null,
): string => {
  return normalizePath(
    `${getYoloSkillsDir(settings)}/${YOLO_SKILLS_INDEX_FILE_NAME}`,
  )
}

export const getYoloSnippetsPath = (
  settings?: YoloSettingsLike | null,
): string => {
  return normalizePath(`${getYoloBaseDir(settings)}/${YOLO_SNIPPETS_FILE_NAME}`)
}

export const getYoloLearningDir = (
  settings?: YoloSettingsLike | null,
): string => {
  return normalizePath(`${getYoloBaseDir(settings)}/${YOLO_LEARNING_SUBDIR}`)
}

export const getYoloJsonDbRootDir = (
  settings?: YoloSettingsLike | null,
): string => {
  return normalizePath(`${getYoloBaseDir(settings)}/${YOLO_JSON_DB_DIR_NAME}`)
}
