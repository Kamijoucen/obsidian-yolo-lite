import { estimateJsonTokens, estimateTextTokens } from './contextTokenEstimate'
import { formatTokenCount } from './formatTokenCount'

describe('contextTokenEstimate', () => {
  it('returns stable JSON token counts regardless of object key order', async () => {
    const left = await estimateJsonTokens({ b: 2, nested: { z: 1, a: 2 } })
    const right = await estimateJsonTokens({ nested: { a: 2, z: 1 }, b: 2 })
    expect(left).toBe(right)
  })

  it('counts more tokens for longer text', async () => {
    expect(await estimateTextTokens('short')).toBeLessThan(
      await estimateTextTokens('short text with more details'),
    )
  })

  it('uses a bounded estimate for base64 images', async () => {
    const tokens = await estimateJsonTokens({
      image: `data:image/png;base64,${'A'.repeat(2_000_000)}`,
    })
    expect(tokens).toBeLessThan(5000)
  })
})

describe('formatTokenCount', () => {
  it('formats compact token counts for display', () => {
    expect(formatTokenCount(512)).toBe('512')
    expect(formatTokenCount(1200)).toBe('1.2k')
    expect(formatTokenCount(12600)).toBe('13k')
  })
})
