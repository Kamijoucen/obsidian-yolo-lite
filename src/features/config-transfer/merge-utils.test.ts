import { deepMerge } from './merge-utils'

describe('deepMerge', () => {
  it('should merge flat objects, incoming overrides base', () => {
    const base = { a: 1, b: 2, c: 3 }
    const incoming = { b: 20, d: 4 }
    const result = deepMerge(base, incoming)
    expect(result).toEqual({ a: 1, b: 20, c: 3, d: 4 })
  })

  it('should recursively merge nested objects', () => {
    const base = {
      agentOptions: {
        enabled: true,
        chunkSize: 1000,
        limit: 10,
        excludePatterns: ['*.tmp'],
      },
    }
    const incoming = {
      agentOptions: {
        chunkSize: 800,
        limit: 20,
      },
    }
    const result = deepMerge(base, incoming)
    expect(result).toEqual({
      agentOptions: {
        enabled: true,
        chunkSize: 800,
        limit: 20,
        excludePatterns: ['*.tmp'],
      },
    })
  })

  it('should replace arrays entirely (not merge them)', () => {
    const base = { items: [1, 2, 3] }
    const incoming = { items: [4, 5] }
    const result = deepMerge(base, incoming)
    expect(result).toEqual({ items: [4, 5] })
  })

  it('should handle incoming overriding object with primitive', () => {
    const base = { nested: { a: 1 } }
    const incoming = { nested: 'replaced' }
    const result = deepMerge(
      base,
      incoming as unknown as Record<string, unknown>,
    )
    expect(result).toEqual({ nested: 'replaced' })
  })

  it('should handle incoming overriding primitive with object', () => {
    const base = { value: 'string' }
    const incoming = { value: { nested: true } }
    const result = deepMerge(
      base as unknown as Record<string, unknown>,
      incoming as unknown as Record<string, unknown>,
    )
    expect(result).toEqual({ value: { nested: true } })
  })

  it('should not mutate the base object', () => {
    const base = { a: 1, nested: { b: 2 } }
    const incoming = { nested: { b: 3, c: 4 } }
    const result = deepMerge(base, incoming)
    expect(base.nested.b).toBe(2)
    expect(result).toEqual({ a: 1, nested: { b: 3, c: 4 } })
  })

  it('should handle empty incoming object', () => {
    const base = { a: 1, b: 2 }
    const result = deepMerge(base, {})
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should handle empty base object', () => {
    const incoming = { a: 1, b: 2 }
    const result = deepMerge({}, incoming)
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should deeply merge multiple levels', () => {
    const base = {
      level1: {
        level2: {
          level3: { a: 1, b: 2 },
          other: 'keep',
        },
      },
    }
    const incoming = {
      level1: {
        level2: {
          level3: { b: 20, c: 3 },
        },
      },
    }
    const result = deepMerge(base, incoming)
    expect(result).toEqual({
      level1: {
        level2: {
          level3: { a: 1, b: 20, c: 3 },
          other: 'keep',
        },
      },
    })
  })

  it('should allow null in incoming to override object in base', () => {
    const base = { config: { a: 1, b: 2 } }
    const incoming = { config: null }
    const result = deepMerge(
      base as unknown as Record<string, unknown>,
      incoming as unknown as Record<string, unknown>,
    )
    expect(result).toEqual({ config: null })
  })

  it('should handle both base and incoming being empty', () => {
    const result = deepMerge({}, {})
    expect(result).toEqual({})
  })
})
