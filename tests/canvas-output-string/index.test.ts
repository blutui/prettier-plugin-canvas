import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Output: String', () => {
  test('it should default to using single quotes', async () => {
    const result = await format(
      heredoc`
        {{ "hello" }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ 'hello' }}
      `
    )
  })

  test('it should keep double quotes if the string includes single quotes', async () => {
    const result = await format(
      heredoc`
        {{ "string o' string" }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ "string o' string" }}
      `
    )
  })

  test('it should keep double quotes for strings using interpolation, since #{...} only works in double quotes', async () => {
    const result = await format(
      heredoc`
        {{ "Hello #{name}" }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ "Hello #{name}" }}
      `
    )
  })

  test('it should still convert a plain single-quoted string to the preferred quote', async () => {
    const result = await format(
      heredoc`
        {{ 'hello' }}
      `,
      { canvasSingleQuote: false }
    )

    expect(result).toBe(
      heredoc`
        {{ "hello" }}
      `
    )
  })
})
