import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Named End Tags', () => {
  test('it should keep the name on endblock', async () => {
    const result = await format(
      heredoc`
        {% block a %}
        x
        {% endblock a %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% block a %}
          x
        {% endblock a %}
      `
    )
  })

  test('it should keep the name on endmacro', async () => {
    const result = await format(
      heredoc`
        {% macro input(name) %}
        x
        {% endmacro input %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% macro input(name) %}
          x
        {% endmacro input %}
      `
    )
  })

  test('it should not invent a name when the source has none', async () => {
    const result = await format(
      heredoc`
        {% block a %}
        x
        {% endblock %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% block a %}
          x
        {% endblock %}
      `
    )
  })
})
