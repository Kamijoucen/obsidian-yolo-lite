const DEFAULT_DELIMITER = '__'

export class InvalidToolNameError extends Error {
  constructor(name: string) {
    super(`Invalid internal tool name: ${name}`)
    this.name = 'InvalidToolNameError'
  }
}

/**
 * Parses a combined tool name into namespace and short-name components.
 * @param name Combined tool name to parse
 * @param delimiter Optional custom delimiter
 */
export function parseToolName(
  name: string,
  delimiter: string = DEFAULT_DELIMITER,
): {
  namespace: string
  toolName: string
} {
  const regex = new RegExp(`^(.+?)${delimiter}(.+)$`)
  const match = name.match(regex)

  if (!match || match.length < 3) {
    throw new InvalidToolNameError(name)
  }

  const namespace = match[1]
  const toolName = match[2]

  if (!namespace || !toolName) {
    throw new InvalidToolNameError(name)
  }

  return { namespace, toolName }
}

/**
 * Creates a combined tool name from namespace and short-name components.
 * @param namespace Tool namespace component
 * @param toolName Tool name component
 * @param delimiter Optional custom delimiter
 */
export function getToolName(
  namespace: string,
  toolName: string,
  delimiter: string = DEFAULT_DELIMITER,
): string {
  return `${namespace}${delimiter}${toolName}`
}
