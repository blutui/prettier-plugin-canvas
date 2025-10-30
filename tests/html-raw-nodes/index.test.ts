import { format, heredoc } from 'tests/utils'
import { describe, expect, test } from 'vitest'

describe('HTML Raw Nodes', () => {
  test('it should create a block rendering context for raw nodes', async () => {
    const result = await format(
      heredoc`
        <span> hello<script type="text/javascript">console.log('hello world');</script>hello </span>
      `
    )

    expect(result).toBe(
      heredoc`
        <span>
          hello
          <script type="text/javascript">
            console.log("hello world");
          </script>
          hello
        </span>
      `
    )
  })

  test('it should create a block rendering context for raw nodes even with htmlWhitespaceSensitivity set to ignore', async () => {
    const result = await format(
      heredoc`
        <span> hello<script type="text/javascript">console.log('hello world');</script>hello </span>
      `,
      {
        htmlWhitespaceSensitivity: 'ignore',
      }
    )

    expect(result).toBe(
      heredoc`
        <span>
          hello
          <script type="text/javascript">
            console.log("hello world");
          </script>
          hello
        </span>
      `
    )
  })

  test('it should create a block rendering context for raw nodes even with htmlWhitespaceSensitivity set to strict', async () => {
    const result = await format(
      heredoc`
        <span> hello<script type="text/javascript">console.log('hello world');</script>hello </span>
      `,
      {
        htmlWhitespaceSensitivity: 'strict',
      }
    )

    expect(result).toBe(
      heredoc`
        <span>
          hello
          <script type="text/javascript">
            console.log("hello world");
          </script>
          hello
        </span>
      `
    )
  })
})
