import { z } from 'zod'

import { webSearchSettingsSchema } from '../../core/web-search/types'
import { assistantSchema } from '../../types/assistant.types'
import { chatModelSchema } from '../../types/chat-model.types'
import { llmProviderSchema } from '../../types/provider.types'
import { REASONING_LEVELS } from '../../types/reasoning'
import { builtinToolOptionsSchema } from '../../types/tool.types'
import { DEFAULT_CHAT_QUICK_ACCESS_ENTRIES } from '../chatQuickAccess'

import { SETTINGS_SCHEMA_VERSION } from './version'

const resilientArraySchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .array(z.unknown())
    .transform((items): Array<z.infer<T>> => {
      return items.flatMap((item) => {
        const parsed = itemSchema.safeParse(item)
        return parsed.success ? [parsed.data] : []
      })
    })
    .catch([])

export const DEFAULT_MODEL_REQUEST_TIMEOUT_MS = 60000
export const MAX_MODEL_REQUEST_TIMEOUT_MS = 60 * 60 * 1000

export const notificationChannelSchema = z.enum(['sound', 'system', 'both'])
export type NotificationChannel = z.infer<typeof notificationChannelSchema>
export const notificationTimingSchema = z.enum(['always', 'when-unfocused'])
export type NotificationTiming = z.infer<typeof notificationTimingSchema>

const notificationOptionsSchema = z
  .object({
    enabled: z.boolean().optional(),
    channel: notificationChannelSchema.optional(),
    timing: notificationTimingSchema.optional(),
    notifyOnApprovalRequired: z.boolean().optional(),
    notifyOnTaskCompleted: z.boolean().optional(),
  })
  .catch({
    enabled: false,
    channel: 'sound',
    timing: 'when-unfocused',
    notifyOnApprovalRequired: true,
    notifyOnTaskCompleted: true,
  })

export const jsSandboxSettingsSchema = z.object({
  allowFetch: z.boolean().optional(),
  fetchMode: z.enum(['whitelist', 'blacklist']).optional(),
  fetchDomains: z.array(z.string()).optional(),
  fetchMaxConcurrent: z.number().optional(),
  fetchMaxResponseKb: z.number().optional(),
  allowVaultRead: z.boolean().optional(),
  // Maximum size (in KB) returned by $vault.readText / $vault.readBinary.
  // Files exceeding this are truncated (text) or refused (binary).
  vaultReadMaxKb: z.number().optional(),
  allowBrowserRead: z.boolean().optional(),
  // Maximum size (in KB) returned by $browser.readHtml. Pages exceeding
  // this are refused so callers do not silently receive partial HTML.
  browserReadMaxKb: z.number().optional(),
  allowExternalScripts: z.boolean().optional(),
  // Execution timeout cap, in milliseconds. The LLM may pass a smaller
  // timeoutMs in its tool args, but the host clamps the effective value
  // to this cap. Undefined means use the built-in default.
  timeoutMs: z.number().optional(),
  // Maximum size (in KB) of the tool's serialized JSON result returned to
  // the model. Output above this is truncated with a prefix. Undefined
  // uses the built-in default. Host enforces a hard ceiling.
  outputMaxKb: z.number().optional(),
})

export type JsSandboxSettings = z.infer<typeof jsSandboxSettingsSchema>

/**
 * Settings
 */

export const yoloSettingsSchema = z.object({
  // Version
  version: z.literal(SETTINGS_SCHEMA_VERSION).default(SETTINGS_SCHEMA_VERSION),

  providers: resilientArraySchema(llmProviderSchema),

  chatModels: resilientArraySchema(chatModelSchema),

  chatModelId: z.string().catch(''), // model for default chat feature
  chatTitleModelId: z.string().catch(''), // model for automatic conversation naming

  // System Prompt
  systemPrompt: z.string().catch(''),

  // Built-in Agent tools
  tools: z
    .object({
      builtinToolOptions: builtinToolOptionsSchema.catch({}),
    })
    .catch({
      builtinToolOptions: {},
    }),

  // JS sandbox (js_eval) capability configuration is global; execution
  // approval remains a per-agent tool preference.
  jsSandbox: jsSandboxSettingsSchema.catch({}),

  // Web search configuration (built-in agent tool)
  webSearch: webSearchSettingsSchema.catch({
    providers: [],
    defaultProviderId: undefined,
    common: {
      resultSize: 10,
      searchTimeoutMs: 120000,
      scrapeTimeoutMs: 20000,
    },
  }),

  // Skills configuration
  skills: z
    .object({
      // Globally disabled skills, stored by canonical skill name.
      disabledSkillNames: z.array(z.string()).catch([]),
    })
    .catch({
      disabledSkillNames: [],
    }),

  // YOLO workspace configuration
  yolo: z
    .object({
      baseDir: z.string().catch('YOLO'),
    })
    .catch({
      baseDir: 'YOLO',
    }),

  debug: z
    .object({
      captureRawRequestDebug: z.boolean().optional(),
    })
    .catch({
      captureRawRequestDebug: false,
    }),

  // Chat options
  chatOptions: z
    .object({
      mentionDisplayMode: z.enum(['inline', 'badge']).optional(),
      mentionContextMode: z.enum(['light', 'full']).optional(),
      chatInputHeight: z.number().int().min(80).max(520).optional(),
      chatApplyMode: z.enum(['review-required', 'direct-apply']).optional(),
      chatTitlePrompt: z.string().optional(),
      // Chat mode (ask/agent)
      chatMode: z.enum(['ask', 'agent']).optional(),
      // Auto-approve tool calls (YOLO). Orthogonal to chatMode; only effective
      // in Agent mode.
      agentYoloEnabled: z.boolean().optional(),
      // Whether the user has acknowledged the first-time full access (YOLO) warning
      fullAccessWarningConfirmed: z.boolean().optional(),
      // Persist preferred reasoning level per model id in Chat input
      reasoningLevelByModelId: z
        .record(z.string(), z.enum(REASONING_LEVELS))
        .optional(),
      // Auto context compaction prompt injected at runtime LLM boundaries
      // (based on last assistant usage).
      autoContextCompactionEnabled: z.boolean().optional(),
      autoContextCompactionThresholdMode: z
        .enum(['tokens', 'ratio'])
        .optional(),
      autoContextCompactionThresholdTokens: z.number().int().min(1).optional(),
      autoContextCompactionThresholdRatio: z.number().min(0).max(1).optional(),
      // Font scale factor for chat messages (1 = default)
      chatFontScale: z.number().min(0.7).max(1.5).optional(),
      // Image reading & compression for vision tool calls
      imageReadingEnabled: z.boolean().optional(),
      imageCompressionEnabled: z.boolean().optional(),
      imageCompressionQuality: z.number().min(1).max(100).optional(),
      // Fetch external (http/https) image URLs referenced in Markdown
      externalImageFetchEnabled: z.boolean().optional(),
      // Include assistant reasoning in exported chat markdown
      chatExportIncludeThinking: z.boolean().optional(),
      // Include tool call blocks in exported chat markdown
      chatExportIncludeToolCalls: z.boolean().optional(),
      // Where the ribbon icon should open the Chat view
      ribbonClickAction: z
        .enum(['sidebar', 'tab', 'split', 'window', 'last'])
        .optional(),
      // Last placement actually used to open a chat leaf; only consulted when
      // `ribbonClickAction === 'last'`
      lastChatPlacement: z
        .enum(['sidebar', 'tab', 'split', 'window'])
        .optional(),
      quickAccessEntries: resilientArraySchema(
        z.discriminatedUnion('type', [
          z.object({ type: z.literal('skill'), name: z.string().min(1) }),
          z.object({ type: z.literal('snippet'), id: z.string().min(1) }),
        ]),
      ).optional(),
    })
    .catch({
      mentionDisplayMode: 'inline',
      mentionContextMode: 'light',
      chatInputHeight: undefined,
      chatApplyMode: 'review-required',
      chatTitlePrompt: '',
      chatMode: 'agent',
      fullAccessWarningConfirmed: false,
      reasoningLevelByModelId: {},
      autoContextCompactionEnabled: false,
      autoContextCompactionThresholdMode: 'tokens',
      autoContextCompactionThresholdTokens: 100000,
      autoContextCompactionThresholdRatio: 0.8,
      chatFontScale: undefined,
      imageReadingEnabled: true,
      imageCompressionEnabled: true,
      imageCompressionQuality: 85,
      externalImageFetchEnabled: false,
      chatExportIncludeThinking: false,
      chatExportIncludeToolCalls: false,
      ribbonClickAction: 'sidebar',
      lastChatPlacement: undefined,
      quickAccessEntries: DEFAULT_CHAT_QUICK_ACCESS_ENTRIES,
    }),

  notificationOptions: notificationOptionsSchema,

  requestPolicy: z
    .object({
      streamFallbackRecoveryEnabled: z.boolean().catch(true),
      primaryRequestTimeoutMs: z
        .number()
        .int()
        .min(1000)
        .max(MAX_MODEL_REQUEST_TIMEOUT_MS)
        .catch(DEFAULT_MODEL_REQUEST_TIMEOUT_MS),
    })
    .catch({
      streamFallbackRecoveryEnabled: true,
      primaryRequestTimeoutMs: DEFAULT_MODEL_REQUEST_TIMEOUT_MS,
    }),

  // Assistant list
  assistants: resilientArraySchema(assistantSchema),

  // Currently selected assistant ID
  currentAssistantId: z.string().optional(),
})
export type YoloSettings = z.infer<typeof yoloSettingsSchema>
