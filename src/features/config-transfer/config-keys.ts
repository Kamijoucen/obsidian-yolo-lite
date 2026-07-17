import { ConfigKeyMeta } from './types'

/**
 * 可导入/导出的配置 key 列表及其元信息。
 * 按 data.json 第一层级 key 划分。
 *
 * 显示用文案优先通过 i18n key `configTransfer.keyLabels.<key>` 查找，
 * 缺失时回退到 `fallbackLabel`，避免直接显示原始 key。
 *
 * "是否含凭证"由 `hasNonEmptyCredentials()` 对实际数据动态探测，
 * 不在此处用静态标记 —— 同一个类目（如 mcp / providers）在不同用户的
 * 配置里可能有或没有真凭证，类目级别打标会误导。
 */
export const EXPORTABLE_CONFIG_KEYS: ConfigKeyMeta[] = [
  { key: 'providers', fallbackLabel: 'AI 服务商' },
  { key: 'chatModels', fallbackLabel: '对话模型' },
  { key: 'chatModelId', fallbackLabel: '默认对话模型' },
  { key: 'chatTitleModelId', fallbackLabel: '标题生成模型' },
  { key: 'systemPrompt', fallbackLabel: '系统提示词' },
  { key: 'mcp', fallbackLabel: 'MCP 工具' },
  { key: 'webSearch', fallbackLabel: '联网搜索' },
  { key: 'skills', fallbackLabel: '技能设置' },
  { key: 'yolo', fallbackLabel: '基础设置' },
  { key: 'debug', fallbackLabel: '调试设置' },
  { key: 'chatOptions', fallbackLabel: '对话偏好' },
  { key: 'notificationOptions', fallbackLabel: '通知设置' },
  { key: 'requestPolicy', fallbackLabel: '模型请求策略' },
  { key: 'assistants', fallbackLabel: 'Agent 配置' },
  { key: 'currentAssistantId', fallbackLabel: '当前 Agent' },
]

/**
 * 不参与导入导出的内部字段
 */
export const EXCLUDED_KEYS = new Set(['version', '__meta'])
