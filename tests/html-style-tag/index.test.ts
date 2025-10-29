import { format, heredoc } from 'tests/utils'
import { describe, expect, test } from 'vitest'

describe('HTML Style Tag', () => {
  test('it should reindent base case', async () => {
    const result = await format(
      heredoc`
        <div>
        <style>
        :root {
          --bg-color: {{ settings.bgColor }};
        }

        .container {
          width: 100%;
        }
        </style>
        <style id="my-style">
          .container {
            width: 100%;
          }
        </style>
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div>
          <style>
            :root {
              --bg-color: {{ settings.bgColor }};
            }

            .container {
              width: 100%;
            }
          </style>
          <style id="my-style">
            .container {
              width: 100%;
            }
          </style>
        </div>
      `
    )
  })

  test('it should be idempotent and not reindent multiple times', async () => {
    const result = await format(
      heredoc`
        <style>section.foo { display:none; }</style>
      `
    )

    expect(result).toBe(
      heredoc`
        <style>
          section.foo {
            display: none;
          }
        </style>
      `
    )
  })
})
