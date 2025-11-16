import { describe, expect, test } from 'vitest'
import { format, heredoc } from 'tests/utils'

describe('HTML Script Tags', () => {
  test('it correctly breaks', async () => {
    const result = await format(
      heredoc`
        <div>
        <script src="{{ asset('js/short.js') }}" defer="defer"></script>
        <script src="{{ asset('js/very-long-line-oh-my-goodness.js') }}" defer="defer"></script>
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div>
          <script src="{{ asset('js/short.js') }}" defer="defer"></script>
          <script
            src="{{ asset('js/very-long-line-oh-my-goodness.js') }}"
            defer="defer"
          ></script>
        </div>
      `
    )
  })
})
