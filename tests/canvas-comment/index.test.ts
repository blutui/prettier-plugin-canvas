import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Comment', () => {
  test('it should format a single line comment', async () => {
    const result = await format(
      heredoc`
        {# hello #}
      `
    )

    expect(result).toBe(
      heredoc`
        {# hello #}
      `
    )
  })

  test('it should preserve whitespace trimming modifiers', async () => {
    const result = await format(
      heredoc`
        {#- hello -#}
      `
    )

    expect(result).toBe(
      heredoc`
        {#- hello -#}
      `
    )
  })

  test('it should preserve line whitespace trimming modifiers', async () => {
    const result = await format(
      heredoc`
        {#~ hello ~#}
      `
    )

    expect(result).toBe(
      heredoc`
        {#~ hello ~#}
      `
    )
  })

  test('it should not reflow the body of a multi line comment', async () => {
    const source = heredoc`
      {#
        line one
        line two
      #}
    `
    const result = await format(source)

    expect(result).toBe(source)
    expect(await format(result)).toBe(result)
  })

  test('it should format a comment nested in an html element', async () => {
    const result = await format(
      heredoc`
        <div>{# note #}<p>x</p></div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div>
          {# note #}
          <p>x</p>
        </div>
      `
    )
  })

  test('it should allow # and } inside the comment body', async () => {
    const result = await format(
      heredoc`
        {# uses # and } inside #}
      `
    )

    expect(result).toBe(
      heredoc`
        {# uses # and } inside #}
      `
    )
  })
})
