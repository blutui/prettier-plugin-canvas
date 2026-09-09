import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Named Arguments', () => {
  test('it should keep = for named arguments in a function call', async () => {
    const result = await format(
      heredoc`
        {{ range(low = 1, high = 10, step = 2) }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ range(low = 1, high = 10, step = 2) }}
      `
    )
  })

  test('it should keep : for hash literal entries', async () => {
    const result = await format(
      heredoc`
        {{ { foo: 'bar', baz: 2 } }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ { foo: 'bar', baz: 2 } }}
      `
    )
  })

  test('it should normalise spacing around the separator without changing it', async () => {
    const result = await format(
      heredoc`
        {{ date(timezone='Europe/Paris') }}
        {{ { foo:'bar' } }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ date(timezone = 'Europe/Paris') }}
        {{ { foo: 'bar' } }}
      `
    )
  })

  test('it should keep both separators when a call takes a hash argument', async () => {
    const result = await format(
      heredoc`
        {{ canopy.blocks('main', { shared: true }) }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ canopy.blocks('main', { shared: true }) }}
      `
    )
  })
})
