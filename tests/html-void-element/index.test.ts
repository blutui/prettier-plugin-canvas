import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('HTML Void Element', () => {
  test('it should borrow parent and close tag parameters', async () => {
    const result = await format(
      heredoc`
        <span><img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"></span>
      `
    )

    expect(result).toBe(
      heredoc`
        <span
          ><img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        ></span>
      `
    )
  })

  test('it should not borrow parent and close tag parameters when htmlWhitespaceSensitivity is set to ignore', async () => {
    const result = await format(
      heredoc`
        <span><img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"></span>
      `,
      {
        htmlWhitespaceSensitivity: 'ignore',
      }
    )

    expect(result).toBe(
      heredoc`
        <span>
          <img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
        </span>
      `
    )
  })

  test('it should borrow prev and next tag parameters', async () => {
    const result = await format(
      heredoc`
        <span><img><img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"><img></span>
      `
    )

    expect(result).toBe(
      heredoc`
        <span
          ><img
          ><img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          ><img
        ></span>
      `
    )
  })

  test('it should not borrow prev and next tag parameters when htmlWhitespaceSensitivity is set to ignore', async () => {
    const result = await format(
      heredoc`
        <span><img><img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"><img></span>
      `,
      {
        htmlWhitespaceSensitivity: 'ignore',
      }
    )

    expect(result).toBe(
      heredoc`
        <span>
          <img>
          <img src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
          <img>
        </span>
      `
    )
  })
})
