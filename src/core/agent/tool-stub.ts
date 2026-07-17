import type { McpTool } from '../../types/mcp.types'

/**
 * Maximum length of the stub description registered in the `tools` field.
 * Kept short because every byte counts toward the frozen cache prefix; the
 * full description is delivered later via `yolo_local__load_tool_schemas` results.
 */
const STUB_DESCRIPTION_MAX_CHARS = 200

const STUB_DESCRIPTION_SUFFIX =
  ' ON-DEMAND: Before calling this tool, call yolo_local__load_tool_schemas with {"servers":["<server>"]} to load its full schema.'

const truncateDescription = (description: string | undefined): string => {
  const raw = (description ?? '').trim()
  if (raw.length === 0) {
    return STUB_DESCRIPTION_SUFFIX.trim()
  }
  const maxRawLength = STUB_DESCRIPTION_MAX_CHARS
  if (raw.length <= maxRawLength) {
    return `${raw}${STUB_DESCRIPTION_SUFFIX}`
  }
  return `${raw.slice(0, maxRawLength - 3)}...${STUB_DESCRIPTION_SUFFIX}`
}

/**
 * Build the stub `inputSchema` that the registered tool exposes to the LLM
 * before its real schema has been disclosed via `load_tool_schemas`.
 *
 * OpenAI Responses and Chat Completions accept the open
 * `{additionalProperties: true}` form, allowing arguments learned from the
 * disclosed full schema.
 */
export const buildStubInputSchema = (
  _apiType?: unknown,
): McpTool['inputSchema'] => {
  return {
    type: 'object',
    properties: {},
    additionalProperties: true,
  }
}

/**
 * Convert a real MCP tool definition into the stub form that is safe to
 * register in the LLM request's `tools` field for an entire conversation. The
 * stub keeps the tool name stable (so `tools` hashes consistently across
 * turns) while withholding the full input schema until disclosure.
 */
export const buildToolStub = (tool: McpTool, apiType?: unknown): McpTool => {
  return {
    ...tool,
    description: truncateDescription(tool.description),
    inputSchema: buildStubInputSchema(apiType),
  }
}
