import {
  AdvancedLinesDiffComputer,
  ILinesDiffComputerOptions,
  LineRangeMapping,
} from 'vscode-diff'

export type InlineDiffToken = {
  type: 'same' | 'add' | 'del'
  text: string
}

export type InlineDiffLine = {
  type: 'unchanged' | 'modified' | 'added' | 'removed'
  tokens: InlineDiffToken[]
}

export function createInlineDiffLines(
  originalLines: string[],
  modifiedLines: string[],
): InlineDiffLine[] {
  if (originalLines.length === 0 && modifiedLines.length === 0) {
    return []
  }

  if (originalLines.length === 0) {
    return modifiedLines.map((line) => ({
      type: 'added',
      tokens: [{ type: 'add', text: line }],
    }))
  }

  if (modifiedLines.length === 0) {
    return originalLines.map((line) => ({
      type: 'removed',
      tokens: [{ type: 'del', text: line }],
    }))
  }

  const advOptions: ILinesDiffComputerOptions = {
    ignoreTrimWhitespace: false,
    computeMoves: false,
    maxComputationTimeMs: 0,
  }
  const advDiffComputer = new AdvancedLinesDiffComputer()
  const advLineChanges = advDiffComputer.computeDiff(
    originalLines,
    modifiedLines,
    advOptions,
  ).changes

  const inlineLines: InlineDiffLine[] = []
  let lastOriginalEndLineNumberExclusive = 1

  advLineChanges.forEach((change: LineRangeMapping) => {
    const oStart = change.originalRange.startLineNumber
    const oEnd = change.originalRange.endLineNumberExclusive
    const mStart = change.modifiedRange.startLineNumber
    const mEnd = change.modifiedRange.endLineNumberExclusive

    if (oStart > lastOriginalEndLineNumberExclusive) {
      const unchanged = originalLines.slice(
        lastOriginalEndLineNumberExclusive - 1,
        oStart - 1,
      )
      unchanged.forEach((line) => {
        inlineLines.push({
          type: 'unchanged',
          tokens: [{ type: 'same', text: line }],
        })
      })
    }

    const removed = originalLines.slice(oStart - 1, oEnd - 1)
    const added = modifiedLines.slice(mStart - 1, mEnd - 1)

    removed.forEach((line) => {
      inlineLines.push({
        type: 'removed',
        tokens: [{ type: 'del', text: line }],
      })
    })
    added.forEach((line) => {
      inlineLines.push({
        type: 'added',
        tokens: [{ type: 'add', text: line }],
      })
    })

    lastOriginalEndLineNumberExclusive = oEnd
  })

  const remaining = originalLines.slice(lastOriginalEndLineNumberExclusive - 1)
  remaining.forEach((line) => {
    inlineLines.push({
      type: 'unchanged',
      tokens: [{ type: 'same', text: line }],
    })
  })

  return inlineLines
}
