import { describe, expect, test } from 'vitest'
import { format, heredoc } from '../utils'

describe('HTML Attributes', () => {
  test('it should use double quotes for all attributes, unless boolean attribute', async () => {
    const result = await format(
      heredoc`
        <div id=123 class='long string of classes' style="color: blue;" content="" disabled></div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div
          id="123"
          class="long string of classes"
          style="color: blue;"
          content=""
          disabled
        ></div>
      `
    )
  })
})
