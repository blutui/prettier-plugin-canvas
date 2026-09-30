import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: elseif', () => {
  test('it should treat elseif as a branch of the if tag', async () => {
    const result = await format(
      heredoc`
        {% if a %}
        a
        {% elseif b %}
        b
        {% else %}
        c
        {% endif %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% if a %}
          a
        {% elseif b %}
          b
        {% else %}
          c
        {% endif %}
      `
    )
  })

  test('it should support several elseif branches', async () => {
    const result = await format(
      heredoc`
        {% if a %}
        a
        {% elseif b %}
        b
        {% elseif c %}
        c
        {% else %}
        d
        {% endif %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% if a %}
          a
        {% elseif b %}
          b
        {% elseif c %}
          c
        {% else %}
          d
        {% endif %}
      `
    )
  })

  test('it should branch on comparisons as well as bare variables', async () => {
    const result = await format(
      heredoc`
        {% if a == 1 %}
        a
        {% elseif b != 2 %}
        b
        {% endif %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% if a == 1 %}
          a
        {% elseif b != 2 %}
          b
        {% endif %}
      `
    )
  })

  test('it should branch correctly when nested in markup', async () => {
    const result = await format(
      heredoc`
        <div>
        {% if a %}<p>a</p>{% elseif b %}<p>b</p>{% endif %}
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div>
          {% if a %}
            <p>a</p>
          {% elseif b %}
            <p>b</p>
          {% endif %}
        </div>
      `
    )
  })

  test('it should support the is not test operator', async () => {
    const result = await format(
      heredoc`
        {% if a is not defined %}
        a
        {% endif %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% if a is not defined %}
          a
        {% endif %}
      `
    )
  })
})
