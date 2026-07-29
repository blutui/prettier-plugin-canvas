import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Set Block', () => {
  test('it should indent the body of a capture block', async () => {
    const result = await format(
      heredoc`
        {% set content %}
        <p>hi</p>
        {% endset %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% set content %}
          <p>hi</p>
        {% endset %}
      `
    )
  })

  test('it should format canvas tags inside a capture block', async () => {
    const result = await format(
      heredoc`
        {% set content %}
        {% include "template.html" %}
        {% endset %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% set content %}
          {% include 'template.html' %}
        {% endset %}
      `
    )
  })

  test('it should still treat the assignment form as a statement', async () => {
    const result = await format(
      heredoc`
        {% set foo = 'bar' %}
        {% set foo, bar = 'foo', 'bar' %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% set foo = 'bar' %}
        {% set foo, bar = 'foo', 'bar' %}
      `
    )
  })

  test('it should format a capture block nested in markup', async () => {
    const result = await format(
      heredoc`
        <div>
        {% set c %}
        <p>x</p>
        {% endset %}
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div>
          {% set c %}
            <p>x</p>
          {% endset %}
        </div>
      `
    )
  })
})
