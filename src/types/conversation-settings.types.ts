export type ConversationOverrideSettings = {
  chatMode?: 'ask' | 'agent' | null
  agentYoloEnabled?: boolean | null
  temperature?: number | null
  top_p?: number | null
  stream?: boolean | null
}
