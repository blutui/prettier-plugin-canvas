import { describe, expect, test } from 'vitest'
import { format, heredoc } from 'tests/utils'

describe('HTML Element', () => {
  test('it should break on html tags that always break', async () => {
    const result = await format(
      heredoc`
        <html><head><link href="hello world"></head><body><main></main></body></html>
      `
    )

    expect(result).toBe(
      heredoc`
        <html>
          <head>
            <link href="hello world">
          </head>
          <body>
            <main></main>
          </body>
        </html>
      `
    )
  })

  test('it should break if original had line breaks', async () => {
    const result = await format(
      heredoc`
        <div x=1 y=2 z=3></div>
        <div
          x=1 y=2 z=3></div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div x="1" y="2" z="3"></div>
        <div
          x="1"
          y="2"
          z="3"
        ></div>
      `
    )
  })

  test('it should indent child', async () => {
    const result = await format(
      heredoc`
        <div x=1 y=2>Child</div>
        <div
          x=1 y=2 z=3>Child</div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div x="1" y="2">Child</div>
        <div
          x="1"
          y="2"
          z="3"
        >
          Child
        </div>
      `
    )
  })

  test('it should not break when it fits on a line', async () => {
    const result = await format(
      heredoc`
        <div x="1" y="2"><div>Hello</div></div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div x="1" y="2"><div>Hello</div></div>
      `
    )
  })

  test('it should break if there is more than 1 child on a line', async () => {
    const result = await format(
      heredoc`
        <div x="1" y="2"><div>Hello</div><div>World</div></div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div x="1" y="2">
          <div>Hello</div>
          <div>World</div>
        </div>
      `
    )
  })
})
