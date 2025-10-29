import { format, heredoc } from 'tests/utils'
import { describe, expect, test } from 'vitest'

describe('HTML Self Closing Element', () => {
  test('it should format self closing tags as expected', async () => {
    const result = await format(
      heredoc`
        <selfclosing/>
        <selfclosing />
        <self-closing with=attributes />
        <self-closing with=attributes that=would span=on multiple lines />
      `,
      {
        printWidth: 40,
      }
    )

    expect(result).toBe(
      heredoc`
        <selfclosing />
        <selfclosing />
        <self-closing with="attributes" />
        <self-closing
          with="attributes"
          that="would"
          span="on"
          multiple
          lines
        />
      `
    )
  })

  test('it should borrow parent and close tag parameters', async () => {
    const result = await format(
      heredoc`
        <span><sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" /></span>
      `
    )

    expect(result).toBe(
      heredoc`
        <span
          ><sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        /></span>
      `
    )
  })

  test('it should not borrow parent and close tag parameters when htmlWhitespaceSensitivity is set to ignore', async () => {
    const result = await format(
      heredoc`
        <span><sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" /></span>
      `,
      {
        htmlWhitespaceSensitivity: 'ignore',
      }
    )

    expect(result).toBe(
      heredoc`
        <span>
          <sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
        </span>
      `
    )
  })

  test('it should borrow previous and next tag parameters', async () => {
    const result = await format(
      heredoc`
        <span><sc /><sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"/><sc/></span>
      `
    )

    expect(result).toBe(
      heredoc`
        <span
          ><sc
          /><sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          /><sc
        /></span>
      `
    )
  })

  test('it should not borrow previous and next tag parameters when htmlWhitespaceSensitivity is set to ignore', async () => {
    const result = await format(
      heredoc`
        <span><sc /><sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"/><sc/></span>
      `,
      {
        htmlWhitespaceSensitivity: 'ignore',
      }
    )

    expect(result).toBe(
      heredoc`
        <span>
          <sc />
          <sc src="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
          <sc />
        </span>
      `
    )
  })
})
