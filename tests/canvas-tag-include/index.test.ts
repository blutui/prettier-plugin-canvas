import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Include', () => {
  test('it should never break a basic include', async () => {
    const result = await format(
      heredoc`
        {% include 'header' %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% include 'header' %}
      `
    )
  })

  test('it should never break an include with ignore missing', async () => {
    const result = await format(
      heredoc`
        {% include 'header' ignore missing %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% include 'header' ignore missing %}
      `
    )
  })

  test('it should never break an include with a context object', async () => {
    const result = await format(
      heredoc`
        {% include 'header' with { foo: 'bar' } %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% include 'header' with { foo: 'bar' } %}
      `
    )
  })
})
