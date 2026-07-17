import { z } from 'zod'

export type ToolDefinition = {
  name: string
  description?: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
    [key: string]: unknown
  }
}

export const builtinToolOptionsSchema = z.record(
  z.string(),
  z.object({
    disabled: z.boolean().optional(),
    allowAutoExecution: z.boolean().optional(),
    blockedPrefixes: z.array(z.string()).optional(),
    allowedModelIds: z.array(z.string()).optional(),
    preferredModelId: z.string().optional(),
  }),
)

export type BuiltinToolOptions = z.infer<typeof builtinToolOptionsSchema>
