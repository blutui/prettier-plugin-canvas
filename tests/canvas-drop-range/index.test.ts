import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Set', () => {
  test('it should stripe whitespace', async () => {
    const result = await format(
      heredoc`
        {{ ( 0 .. 1 ) }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ (0..1) }}
      `
    )
  })
})
