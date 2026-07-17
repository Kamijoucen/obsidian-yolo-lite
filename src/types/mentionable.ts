import { TFile, TFolder } from 'obsidian'

export type MentionableFile = {
  type: 'file'
  file: TFile
}
export type MentionableFolder = {
  type: 'folder'
  folder: TFolder
}

export type CurrentFileViewState =
  | {
      kind: 'markdown-edit'
      visibleStartLine: number // 1-indexed
      visibleEndLine: number // 1-indexed, inclusive
      cursorLine: number // 1-indexed
      totalLines: number
    }
  | {
      kind: 'other'
      totalLines?: number
    }

export type MentionableBlockData = {
  content: string
  file: TFile
  startLine: number
  endLine: number
  contentFormat?: 'markdown-table'
  contentHash?: string
  contentCount?: number
  contentUnit?: 'characters' | 'words' | 'wordsCharacters'
  tableRowCount?: number
  tableColumnCount?: number
}
export type MentionableBlock = MentionableBlockData & {
  type: 'block'
}
export type MentionableAssistantQuote = {
  type: 'assistant-quote'
  conversationId: string
  messageId: string
  content: string
  contentHash?: string
  contentCount?: number
  contentUnit?: 'characters' | 'words' | 'wordsCharacters'
}
export type MentionableUrl = {
  type: 'url'
  url: string
}
export type MentionableImage = {
  type: 'image'
  name: string
  mimeType: string
  data: string // base64
}
export type MentionableOffice = {
  type: 'office'
  name: string
  kind: 'docx' | 'pptx' | 'xlsx'
  rawData: string
  extractedText: string
}
export type TextAttachmentKind =
  | 'txt'
  | 'md'
  | 'csv'
  | 'tsv'
  | 'json'
  | 'yaml'
  | 'yml'
  | 'xml'
  | 'log'
export type MentionableTextAttachment = {
  type: 'text-attachment'
  name: string
  kind: TextAttachmentKind
  content: string
}
export type MentionableModel = {
  type: 'model'
  modelId: string
  name: string
  providerId?: string
}
export type Mentionable =
  | MentionableFile
  | MentionableFolder
  | MentionableBlock
  | MentionableAssistantQuote
  | MentionableUrl
  | MentionableImage
  | MentionableOffice
  | MentionableTextAttachment
  | MentionableModel
export type SerializedMentionableFile = {
  type: 'file'
  file: string
}
export type SerializedMentionableFolder = {
  type: 'folder'
  folder: string
}
export type SerializedMentionableBlock = {
  type: 'block'
  content?: string
  file: string
  startLine: number
  endLine: number
  contentFormat?: 'markdown-table'
  contentHash?: string
  contentCount?: number
  contentUnit?: 'characters' | 'words' | 'wordsCharacters'
  tableRowCount?: number
  tableColumnCount?: number
}
export type SerializedMentionableAssistantQuote = {
  type: 'assistant-quote'
  conversationId: string
  messageId: string
  content?: string
  contentHash?: string
  contentCount?: number
  contentUnit?: 'characters' | 'words' | 'wordsCharacters'
}
export type SerializedMentionableUrl = MentionableUrl
export type SerializedMentionableImage = MentionableImage
export type SerializedMentionableOffice = MentionableOffice
export type SerializedMentionableTextAttachment = MentionableTextAttachment
export type SerializedMentionableModel = MentionableModel
export type SerializedMentionable =
  | SerializedMentionableFile
  | SerializedMentionableFolder
  | SerializedMentionableBlock
  | SerializedMentionableAssistantQuote
  | SerializedMentionableUrl
  | SerializedMentionableImage
  | SerializedMentionableOffice
  | SerializedMentionableTextAttachment
  | SerializedMentionableModel
