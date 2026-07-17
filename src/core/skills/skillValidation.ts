/**
 * Agent Skills 开放标准校验模块。
 * 参考规范:https://agentskills.io/specification
 */

import { parseYaml } from 'obsidian'

export type ValidationError = {
  field: string
  message: string
}

// ---------------------------------------------------------------------------
// name 字段校验
// ---------------------------------------------------------------------------

/**
 * Agent Skills 标准 name 规则:
 * - 1-64 字符
 * - 仅允许小写字母 (a-z)、数字 (0-9)、连字符 (-)
 * - 不能以连字符开头或结尾
 * - 不能包含连续连字符 (--)
 */
const SKILL_NAME_CHARS_PATTERN = /^[a-z0-9-]+$/

export function validateSkillName(name: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'missing' })
    return errors
  }

  const trimmed = name.trim()

  if (trimmed.length > 64) {
    errors.push({ field: 'name', message: 'exceeds 64 characters' })
  }

  if (/[A-Z]/.test(trimmed)) {
    errors.push({ field: 'name', message: 'uppercase not allowed' })
  } else if (!SKILL_NAME_CHARS_PATTERN.test(trimmed)) {
    errors.push({
      field: 'name',
      message: 'only lowercase letters, numbers, and hyphens allowed',
    })
  } else if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    errors.push({
      field: 'name',
      message: 'cannot start or end with hyphen',
    })
  } else if (trimmed.includes('--')) {
    errors.push({
      field: 'name',
      message: 'consecutive hyphens not allowed',
    })
  }

  return errors
}

// ---------------------------------------------------------------------------
// description 字段校验
// ---------------------------------------------------------------------------

export function validateDescription(description: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (typeof description !== 'string' || description.trim().length === 0) {
    errors.push({ field: 'description', message: 'missing' })
    return errors
  }

  if (description.trim().length > 1024) {
    errors.push({
      field: 'description',
      message: 'exceeds 1024 characters',
    })
  }

  return errors
}

// ---------------------------------------------------------------------------
// compatibility 字段校验(可选)
// ---------------------------------------------------------------------------

export function validateCompatibility(
  compatibility: unknown,
): ValidationError[] {
  if (compatibility === undefined || compatibility === null) return []
  if (typeof compatibility === 'string' && compatibility.trim().length > 500) {
    return [{ field: 'compatibility', message: 'exceeds 500 characters' }]
  }
  return []
}

// ---------------------------------------------------------------------------
// Frontmatter 解析(使用 Obsidian parseYaml)
// ---------------------------------------------------------------------------

/**
 * 从 Markdown 内容中解析 YAML frontmatter。
 * closing `---` 必须独占一行,避免 YAML 值中含 `---` 被误截断。
 * 返回 null 表示没有合法 frontmatter(缺失分隔符 / YAML 语法错误 / 非 object 顶层)。
 */
export function parseFrontmatter(
  content: string,
): Record<string, unknown> | null {
  // 用按行切分定位 closing delimiter,确保 `---` 是独立一行
  const normalized = content.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n') && normalized !== '---') {
    return null
  }
  const lines = normalized.split('\n')
  if (lines[0].trim() !== '---') return null
  const endIdx = lines.findIndex(
    (line, idx) => idx >= 1 && line.trim() === '---',
  )
  if (endIdx === -1) return null
  const yamlText = lines.slice(1, endIdx).join('\n')
  try {
    const parsed: unknown = parseYaml(yamlText)
    if (parsed === null || parsed === undefined) return {}
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 包级别校验
// ---------------------------------------------------------------------------

export type FileEntry = {
  relativePath: string
  content: string
}

/**
 * 对文件夹格式的 skill 包进行完整校验(Agent Skills 标准)。
 * 当 dirName 提供时,会校验 frontmatter.name 与 dirName 是否一致。
 */
export function validateDirectoryPackage(
  dirName: string,
  files: FileEntry[],
): ValidationError[] {
  const errors: ValidationError[] = []

  // 1. 必须包含 SKILL.md
  const skillMdEntry = files.find((f) => f.relativePath === 'SKILL.md')
  if (!skillMdEntry) {
    errors.push({ field: 'SKILL.md', message: 'missing' })
    return errors
  }

  // 2. SKILL.md 必须包含有效的 frontmatter
  const frontmatter = parseFrontmatter(skillMdEntry.content)
  if (!frontmatter) {
    errors.push({ field: 'frontmatter', message: 'missing or invalid' })
    return errors
  }

  // 3. 校验 name 字段
  const nameErrors = validateSkillName(frontmatter.name)
  errors.push(...nameErrors)

  // 4. name 必须与文件夹名一致(Agent Skills 规范要求)
  if (
    nameErrors.length === 0 &&
    typeof frontmatter.name === 'string' &&
    frontmatter.name.trim() !== dirName
  ) {
    errors.push({ field: 'name', message: 'must match folder name' })
  }

  // 5. 校验 description 字段
  errors.push(...validateDescription(frontmatter.description))

  // 6. 校验可选字段
  errors.push(...validateCompatibility(frontmatter.compatibility))

  return errors
}

/**
 * 对独立单文件格式的 skill 进行校验。
 * 要求有 frontmatter 且包含 name 字段。
 */
export function validateSingleFileSkill(content: string): ValidationError[] {
  const errors: ValidationError[] = []

  const frontmatter = parseFrontmatter(content)
  if (!frontmatter) {
    errors.push({ field: 'frontmatter', message: 'missing or invalid' })
    return errors
  }

  if (
    typeof frontmatter.name !== 'string' ||
    frontmatter.name.trim().length === 0
  ) {
    errors.push({ field: 'name', message: 'missing' })
  }

  return errors
}
