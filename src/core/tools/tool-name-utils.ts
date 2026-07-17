const DEFAULT_DELIMITER = '__'

export const TOOL_NAME_DELIMITER = DEFAULT_DELIMITER

export class InvalidToolNameError extends Error {
  constructor(name: string) {
    super(`Invalid internal tool name: ${name}`)
    this.name = 'InvalidToolNameError'
  }
}

/**
 * Validates that a tool namespace follows the required format.
 * @param name Namespace to validate
 * @param delimiter Optional custom delimiter
 */
export function validateToolNamespace(
  name: string,
  delimiter: string = DEFAULT_DELIMITER,
): void {
  // OpenAI only allows alphanumeric characters, underscores, and hyphens in the tool name
  const regex = /^[a-zA-Z0-9_-]+$/
  if (!regex.test(name)) {
    throw new Error(
      `Invalid tool namespace: ${name}. Only alphanumeric characters, underscores, and hyphens are allowed.`,
    )
  }
  // Namespaces cannot contain it to ensure proper parsing and formatting.
  if (name.includes(delimiter)) {
    throw new Error(
      `Tool namespace ${name} should not contain the delimiter ${delimiter}.`,
    )
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
