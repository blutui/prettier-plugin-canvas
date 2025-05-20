import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Include', () => {
  test('it should never break a name', async () => {
    const result = await format(
      heredoc`
        {% include 'header' %}
      `,
      {
        printWidth: 1,
      }
    )

    expect(result).toBe(
      heredoc`
        {% include 'header' %}
      `
    )
  })
})
