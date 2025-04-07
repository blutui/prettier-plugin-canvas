import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Output: Sequence', () => {
  test('it should stripe whitespace', async () => {
    const result = await format(
      heredoc`
        {% set items = [ '1', '2', '3', '4', '5' ] %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% set items = ['1', '2', '3', '4', '5'] %}
      `
    )
  })

  test('it can correctly format long sequences', async () => {
    const result = await format(
      heredoc`
        {% set items = [ '1', '2', '3', '4', '5', '6', 7, 8, 9, 0, 'a really long item', 'another long item' ] %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% set items = [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          7,
          8,
          9,
          0,
          'a really long item',
          'another long item'
        ] %}
      `
    )
  })
})
