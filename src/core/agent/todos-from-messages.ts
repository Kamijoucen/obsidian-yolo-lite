import type { ChatMessage } from '../../types/chat'
import {
  ToolCallResponseStatus,
  getToolCallArgumentsObject,
} from '../../types/tool-call.types'
import { parseToolName } from '../tools/tool-name-utils'

export type TodoStatus = 'pending' | 'in_progress' | 'completed'

export type TodoItem = {
  content: string
  status: TodoStatus
}

const EMPTY: ReadonlyArray<TodoItem> = Object.freeze([])

/**
 * Derive the current todo list from the conversation message stream.
 *
 * The source of truth is the latest `todo_write` tool call in the (already
 * branch-filtered) message list — its `arguments.todos` is the live state.
 * No in-memory caching layer is needed: the conversation persistence layer
 * already stores tool call arguments, so this derivation works across
 * Obsidian restarts and naturally respects branches.
 */
export function deriveTodosFromMessages(
  messages: ReadonlyArray<ChatMessage>,
): ReadonlyArray<TodoItem> {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'tool') continue
    for (let j = message.toolCalls.length - 1; j >= 0; j--) {
      const { request, response } = message.toolCalls[j]
      if (!isTodoWriteToolName(request.name)) continue
      // Only successful todo_write calls update the live state. Skip pending,
      // running, rejected, errored, or aborted calls and keep walking back to
      // the previous successful one — a failed write must not overwrite the
      // last good state.
      if (response.status !== ToolCallResponseStatus.Success) continue
      const argsObject = getToolCallArgumentsObject(request.arguments)
      if (!argsObject) return EMPTY
      return parseTodos(argsObject.todos)
    }
  }
  return EMPTY
}

/**
 * Return the request id of the *first* successful `todo_write` in the current
 * todo "series", or `null` if no series exists yet.
 *
 * A series starts when a `todo_write` lands while the previous todo state was
 * "ended" — i.e. there was no prior write, or the previous write was an empty
 * list, or every item in the previous list was `completed`. Subsequent writes
 * within an active (still has non-completed items) series share the same
 * series start id.
 *
 * UI uses this id as the auto-expand trigger key: it changes only when a new
 * batch of work begins, so updates within a batch don't override the user's
 * collapse choice.
 */
export function findTodoSeriesStartId(
  messages: ReadonlyArray<ChatMessage>,
): string | null {
  let prevTodos: ReadonlyArray<TodoItem> | null = null
  let seriesStartId: string | null = null
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    if (message.role !== 'tool') continue
    for (let j = 0; j < message.toolCalls.length; j++) {
      const { request, response } = message.toolCalls[j]
      if (!isTodoWriteToolName(request.name)) continue
      if (response.status !== ToolCallResponseStatus.Success) continue
      const argsObject = getToolCallArgumentsObject(request.arguments)
      const todos = argsObject ? parseTodos(argsObject.todos) : EMPTY
      if (prevTodos === null || isTodoSeriesEnded(prevTodos)) {
        seriesStartId = request.id
      }
      prevTodos = todos
    }
  }
  return seriesStartId
}

function isTodoSeriesEnded(todos: ReadonlyArray<TodoItem>): boolean {
  if (todos.length === 0) return true
  return todos.every((item) => item.status === 'completed')
}

/**
 * Return the request id of the latest successful `todo_write` whose todos
 * are non-empty and entirely `completed`, or `null` if no such call exists.
 *
 * UI uses this as the auto-collapse trigger key: when a write lands that
 * marks the whole list done, the panel collapses itself once. The id only
 * changes on a fresh "everything done" write, so this never fights the user
 * if they manually re-expand an already-completed list.
 */
export function findLatestCompletedTodoWriteId(
  messages: ReadonlyArray<ChatMessage>,
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'tool') continue
    for (let j = message.toolCalls.length - 1; j >= 0; j--) {
      const { request, response } = message.toolCalls[j]
      if (!isTodoWriteToolName(request.name)) continue
      if (response.status !== ToolCallResponseStatus.Success) continue
      const argsObject = getToolCallArgumentsObject(request.arguments)
      const todos = argsObject ? parseTodos(argsObject.todos) : EMPTY
      if (todos.length === 0) return null
      if (todos.every((item) => item.status === 'completed')) return request.id
      return null
    }
  }
  return null
}

function isTodoWriteToolName(name: string): boolean {
  try {
    return parseToolName(name).toolName === 'todo_write'
  } catch {
    return false
  }
}

function parseTodos(value: unknown): ReadonlyArray<TodoItem> {
  if (!Array.isArray(value)) return EMPTY
  const result: TodoItem[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const content = record.content
    const status = record.status
    if (typeof content !== 'string' || content.trim() === '') continue
    if (
      status !== 'pending' &&
      status !== 'in_progress' &&
      status !== 'completed'
    ) {
      continue
    }
    result.push({ content, status })
  }
  return Object.freeze(result)
}
