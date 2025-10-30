import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Raw Tag', () => {
  test('it should not reindent raw tags', async () => {
    const result = await format(
      heredoc`
        <div>
          {% verbatim %}
          const a = [1, 2, 3];
          {% endverbatim %}
        {% verbatim %}
          <div x=1 y=2 z=3>UNCLOSED
        {% endverbatim %}
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div>
          {% verbatim %}
            const a = [1, 2, 3];
          {% endverbatim %}
          {% verbatim %}
            <div x=1 y=2 z=3>UNCLOSED
          {% endverbatim %}
        </div>
      `
    )
  })
})
