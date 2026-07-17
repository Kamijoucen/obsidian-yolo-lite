import { validateAskUserQuestionArgs } from './localFileTools'

describe('validateAskUserQuestionArgs', () => {
  it('accepts a well-formed payload (free_text + single + multi)', () => {
    const result = validateAskUserQuestionArgs({
      questions: [
        {
          id: 'note',
          prompt: 'Anything else?',
          inputType: 'free_text',
        },
        {
          id: 'scope',
          prompt: 'Which folder?',
          inputType: 'single_select',
          options: [
            { id: 'projects', label: 'Projects' },
            { id: 'archive', label: 'Archive' },
          ],
        },
        {
          id: 'tags',
          prompt: 'Pick tags',
          inputType: 'multi_select',
          options: [
            { id: 'work', label: 'Work' },
            { id: 'draft', label: 'Draft' },
          ],
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.questions).toHaveLength(3)
    expect(result.value.questions[1].options).toHaveLength(2)
  })

  it('rejects payloads where questions is missing or empty', () => {
    expect(validateAskUserQuestionArgs({}).ok).toBe(false)
    expect(validateAskUserQuestionArgs({ questions: [] }).ok).toBe(false)
  })

  it('accepts an arbitrarily long question list (no upper limit)', () => {
    const q = (id: string) => ({
      id,
      prompt: 'p',
      inputType: 'free_text' as const,
    })
    const ids = Array.from({ length: 12 }).map((_, i) => `q${i}`)
    const result = validateAskUserQuestionArgs({
      questions: ids.map(q),
    })
    expect(result.ok).toBe(true)
  })

  it('rejects duplicate question ids', () => {
    const result = validateAskUserQuestionArgs({
      questions: [
        { id: 'x', prompt: 'a', inputType: 'free_text' },
        { id: 'x', prompt: 'b', inputType: 'free_text' },
      ],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/duplicated/)
  })

  it('requires single_select / multi_select to have at least 2 options, with no upper bound', () => {
    expect(
      validateAskUserQuestionArgs({
        questions: [{ id: 'a', prompt: 'p', inputType: 'single_select' }],
      }).ok,
    ).toBe(false)
    expect(
      validateAskUserQuestionArgs({
        questions: [
          {
            id: 'a',
            prompt: 'p',
            inputType: 'single_select',
            options: [{ id: 'only', label: 'Only' }],
          },
        ],
      }).ok,
    ).toBe(false)
    const many = Array.from({ length: 12 }).map((_, i) => ({
      id: `o${i}`,
      label: `L${i}`,
    }))
    expect(
      validateAskUserQuestionArgs({
        questions: [
          {
            id: 'a',
            prompt: 'p',
            inputType: 'multi_select',
            options: many,
          },
        ],
      }).ok,
    ).toBe(true)
  })

  it('rejects the reserved "__other__" option id', () => {
    const result = validateAskUserQuestionArgs({
      questions: [
        {
          id: 'a',
          prompt: 'p',
          inputType: 'single_select',
          options: [
            { id: 'x', label: 'X' },
            { id: '__other__', label: 'Other' },
          ],
        },
      ],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/reserved/)
  })

  it('rejects duplicate option ids inside a single question', () => {
    const result = validateAskUserQuestionArgs({
      questions: [
        {
          id: 'a',
          prompt: 'p',
          inputType: 'single_select',
          options: [
            { id: 'x', label: 'X' },
            { id: 'x', label: 'Also X' },
          ],
        },
      ],
    })
    expect(result.ok).toBe(false)
  })

  it('rejects options on free_text', () => {
    expect(
      validateAskUserQuestionArgs({
        questions: [
          {
            id: 'a',
            prompt: 'p',
            inputType: 'free_text',
            options: [
              { id: 'x', label: 'X' },
              { id: 'y', label: 'Y' },
            ],
          },
        ],
      }).ok,
    ).toBe(false)
  })

  it('rejects invalid inputType', () => {
    const result = validateAskUserQuestionArgs({
      questions: [
        { id: 'a', prompt: 'p', inputType: 'yes_or_no' as unknown as string },
      ],
    })
    expect(result.ok).toBe(false)
  })

  it('rejects empty prompt or id', () => {
    expect(
      validateAskUserQuestionArgs({
        questions: [{ id: '', prompt: 'p', inputType: 'free_text' }],
      }).ok,
    ).toBe(false)
    expect(
      validateAskUserQuestionArgs({
        questions: [{ id: 'a', prompt: '   ', inputType: 'free_text' }],
      }).ok,
    ).toBe(false)
  })
})
