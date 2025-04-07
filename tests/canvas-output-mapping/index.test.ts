import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Output: Mapping', () => {
  test('it should break and indent objects', async () => {
    const result = await format(
      heredoc`
        {{ date({ index: 5, isOverview: true, isLongPropertyName: true, hasBeenWaiting: true }) }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{
          date({
            index: 5,
            isOverview: true,
            isLongPropertyName: true,
            hasBeenWaiting: true
          })
        }}
      `
    )
  })
})
