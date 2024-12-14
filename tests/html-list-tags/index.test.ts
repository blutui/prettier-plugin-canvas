import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('HTML List Tags', () => {
  test('it breaks unordered lists', async () => {
    const result = await format(
      heredoc`
        <ul><li>lists always break</li></ul>
      `
    )

    expect(result).toBe(
      heredoc`
        <ul>
          <li>lists always break</li>
        </ul>
      `
    )
  })

  test('it breaks ordered lists', async () => {
    const result = await format(
      heredoc`
        <ol><li>lists always break</li></ol>
      `
    )

    expect(result).toBe(
      heredoc`
        <ol>
          <li>lists always break</li>
        </ol>
      `
    )
  })

  test('it breaks realy long items in a list', async () => {
    const result = await format(
      heredoc`
        <ul>
          <li>really really really really really really really really really really long lines break</li>
          <li>shorter ones don't</li>
        </ul>
      `
    )

    expect(result).toBe(
      heredoc`
        <ul>
          <li>
            really really really really really really really really really really long
            lines break
          </li>
          <li>shorter ones don't</li>
        </ul>
      `
    )
  })
})
