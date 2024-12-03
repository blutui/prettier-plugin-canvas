import { describe, expect, test } from 'vitest'
import { format } from '../utils'

describe('comments', () => {
  test('it can handle HTML comments', async () => {
    const result = await format(
      `<div >
        <!--This is a comment -->
          <span></span>
        </div>`
    )

    expect(result).toBe('<!-- This is a comment -->')
  })
})
