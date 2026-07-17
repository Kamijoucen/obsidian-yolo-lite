import type { Annotation } from '../../types/llm/response'

/**
 * Inject `[N](sourceUrl)` inline citation markers into assistant content
 * based on the `end_index` offsets carried on `url_citation` annotations
 * (returned by OpenAI's hosted web search).
 *
 * Design choices:
 * - Real markdown link to the source URL — gives free link styling
 *   (color/hover) and click-to-source behavior in both renderers.
 * - A `?yolo-cite=N` query parameter is appended so CSS can pick our markers
 *   out (e.g. to render the surrounding `[ ]` via `::before` / `::after`)
 *   without polluting the visible link text.
 * - Markers are inserted at `end_index` (after the cited fact), descending,
 *   so earlier insertions don't shift later offsets. The position is first
 *   snapped to the nearest sentence/clause break so the marker sits *before*
 *   trailing punctuation (`事件[1]。` rather than `事件。[1]`) and never
 *   splits a CJK word (`保加利亚国家系统集成商[1]，` rather than
 *   `保加利亚国家系[1]统集成商，`).
 * - Offsets that land inside a code fence / inline code / `$…$` / `$$…$$` /
 *   `\(…\)` / `\[…\]` / `<think>` / `<yolo_block>` block are pushed to the
 *   end of that block — inserting inside would break highlighting, math,
 *   reasoning blocks, or apply-able edit payloads.
 * - Offsets past the current content length (e.g. streaming hasn't caught up)
 *   are dropped for this render; the next streaming tick rebuilds from full
 *   content + full annotations.
 * - Multiple annotations at the same anchor naturally chain to `[1][2]`
 *   because each insert lands at the same position and pre-pends to the
 *   previous insert.
 */
export function injectAnnotationMarkers(
  content: string,
  annotations: Annotation[] | undefined,
): string {
  if (!annotations || annotations.length === 0) return content

  type Marker = { insertAt: number; ordinal: number; url: string }
  const protectedRanges = computeProtectedRanges(content)

  const markers: Marker[] = []
  annotations.forEach((annotation, index) => {
    if (annotation.type !== 'url_citation') return
    const rawEnd = annotation.url_citation.end_index
    if (typeof rawEnd !== 'number' || !Number.isFinite(rawEnd)) return
    const end = Math.floor(rawEnd)
    if (end <= 0) {
      // end_index <= 0 means "before any content" — useless for a post-fact
      // marker. Skip rather than clutter the very start.
      return
    }
    if (end > content.length) {
      // Streaming hasn't caught up yet; wait for the next render tick.
      return
    }
    const url = annotation.url_citation.url
    if (typeof url !== 'string' || url.length === 0) return
    const snapped = snapToClauseBoundary(content, end)
    const insertAt = pushPastProtectedRange(snapped, protectedRanges)
    markers.push({
      insertAt,
      ordinal: index + 1,
      url: decorateCitationUrl(url, index + 1),
    })
  })

  if (markers.length === 0) return content

  // Sort descending by insertAt so earlier slices stay valid as we splice.
  // For markers at the same position, sort by ordinal descending so that
  // prepending higher ordinals first leaves them on the right — final order
  // reads `[1][2]…` left-to-right.
  markers.sort((a, b) => {
    if (b.insertAt !== a.insertAt) return b.insertAt - a.insertAt
    return b.ordinal - a.ordinal
  })

  let result = content
  for (const marker of markers) {
    // Sanitize the URL so a stray `)` inside it doesn't break the link
    // syntax — encodeURI keeps most printable chars intact but escapes `)`,
    // spaces, and similar.
    const safeUrl = marker.url.replace(/\)/g, '%29').replace(/\s/g, '%20')
    result =
      result.slice(0, marker.insertAt) +
      `[${marker.ordinal}](${safeUrl})` +
      result.slice(marker.insertAt)
  }
  return result
}

/**
 * Snap a raw `end_index` to the nearest sentence/clause break so the marker
 * always lands just before trailing punctuation rather than mid-CJK-word.
 *
 * Cases:
 *  - Position is preceded by punctuation/whitespace (we landed *past* a
 *    terminator) — pull back to the start of that punctuation cluster so
 *    the marker sits just before the punctuation.
 *  - Position is preceded by a word character and followed by punctuation —
 *    already at a clean spot, keep.
 *  - Position is in the middle of a word — scan forward up to
 *    `maxLookAhead` characters; on the first punctuation/whitespace, insert
 *    just before it. If no break is found in window, give up and leave the
 *    raw index alone (drifting too far would disconnect the marker from its
 *    cited span).
 */
function snapToClauseBoundary(
  content: string,
  position: number,
  maxLookAhead = 30,
): number {
  if (position <= 0 || position > content.length) return position

  const prev = content[position - 1]
  const curr = position < content.length ? content[position] : ''

  if (isClauseBreak(prev)) {
    let i = position - 1
    while (i > 0 && isClauseBreak(content[i - 1])) i--
    return i
  }

  if (curr === '' || isClauseBreak(curr)) {
    return position
  }

  const limit = Math.min(content.length, position + maxLookAhead)
  for (let i = position; i < limit; i++) {
    if (isClauseBreak(content[i])) {
      return i
    }
  }
  return position
}

const CLAUSE_BREAK_PATTERN = /[\s.,!?;:。，！？；：、“”‘’]/

function isClauseBreak(ch: string): boolean {
  return CLAUSE_BREAK_PATTERN.test(ch)
}

/**
 * Append `yolo-cite=N` as a query parameter so CSS can pick our citation
 * markers out via an attribute selector without changing where the link
 * actually points. The fragment (if any) is preserved at the tail.
 */
function decorateCitationUrl(url: string, ordinal: number): string {
  const hashIndex = url.indexOf('#')
  const fragment = hashIndex === -1 ? '' : url.slice(hashIndex)
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}yolo-cite=${ordinal}${fragment}`
}

type ProtectedRange = { start: number; end: number }

/**
 * Locate spans where a literal `[N]` insertion would corrupt downstream
 * rendering or land in the wrong semantic block:
 *  - fenced code blocks (```) and inline code (`),
 *  - the four LaTeX delimiter pairs (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`),
 *  - `<think>…</think>` reasoning blocks (citations belong to the answer,
 *    not the chain-of-thought),
 *  - `<yolo_block …>…</yolo_block>` edit blocks (citations inside the
 *    apply-able payload would be written into the user's vault).
 *
 * Ranges are reported as `[start, end)` over the raw content string. A scan
 * pass picks the earliest opener at each position, advances past its matching
 * closer, and resumes — overlapping delimiters of different families don't
 * intersect because we never look inside a span we've already claimed.
 */
function computeProtectedRanges(content: string): ProtectedRange[] {
  const ranges: ProtectedRange[] = []
  let i = 0
  while (i < content.length) {
    // <think>…</think>
    if (content.startsWith('<think>', i)) {
      const close = content.indexOf('</think>', i + 7)
      const end = close === -1 ? content.length : close + 8
      ranges.push({ start: i, end })
      i = end
      continue
    }
    // <yolo_block …>…</yolo_block>
    if (content.startsWith('<yolo_block', i)) {
      const openEnd = content.indexOf('>', i + 11)
      if (openEnd !== -1) {
        const close = content.indexOf('</yolo_block>', openEnd + 1)
        const end = close === -1 ? content.length : close + 13
        ranges.push({ start: i, end })
        i = end
        continue
      }
    }
    // Fenced code block (``` …  ```)
    if (content.startsWith('```', i)) {
      const close = content.indexOf('```', i + 3)
      const end = close === -1 ? content.length : close + 3
      ranges.push({ start: i, end })
      i = end
      continue
    }
    // Inline code (`…`) — single-line, no embedded newlines.
    if (content[i] === '`') {
      const newline = content.indexOf('\n', i + 1)
      const close = content.indexOf('`', i + 1)
      if (close !== -1 && (newline === -1 || close < newline)) {
        ranges.push({ start: i, end: close + 1 })
        i = close + 1
        continue
      }
    }
    // Display math $$…$$
    if (content.startsWith('$$', i)) {
      const close = content.indexOf('$$', i + 2)
      const end = close === -1 ? content.length : close + 2
      ranges.push({ start: i, end })
      i = end
      continue
    }
    // Inline math $…$ — heuristic: require a closing `$` on the same line.
    if (content[i] === '$') {
      const newline = content.indexOf('\n', i + 1)
      const close = content.indexOf('$', i + 1)
      if (close !== -1 && (newline === -1 || close < newline)) {
        ranges.push({ start: i, end: close + 1 })
        i = close + 1
        continue
      }
    }
    // LaTeX \( … \)
    if (content.startsWith('\\(', i)) {
      const close = content.indexOf('\\)', i + 2)
      const end = close === -1 ? content.length : close + 2
      ranges.push({ start: i, end })
      i = end
      continue
    }
    // LaTeX \[ … \]
    if (content.startsWith('\\[', i)) {
      const close = content.indexOf('\\]', i + 2)
      const end = close === -1 ? content.length : close + 2
      ranges.push({ start: i, end })
      i = end
      continue
    }
    i += 1
  }
  return ranges
}

function pushPastProtectedRange(
  position: number,
  ranges: ProtectedRange[],
): number {
  for (const range of ranges) {
    if (position > range.start && position < range.end) {
      return range.end
    }
  }
  return position
}
