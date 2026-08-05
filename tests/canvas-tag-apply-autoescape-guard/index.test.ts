import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: apply/autoescape/guard', () => {
  test('it should format apply with a filter chain', async () => {
    const result = await format(
      heredoc`
        {% apply upper|escape %}
          hello
        {% endapply %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% apply upper | escape %}
          hello
        {% endapply %}
      `
    )
  })

  test('it should format apply with filter arguments', async () => {
    const result = await format(
      heredoc`
        {% apply lower | escape('html') %}
          SOME TEXT
        {% endapply %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% apply lower | escape('html') %}
          SOME TEXT
        {% endapply %}
      `
    )
  })

  test('it should format the legacy filter alias the same way', async () => {
    const result = await format(
      heredoc`
        {% filter upper|escape %}
          hello
        {% endfilter %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% filter upper | escape %}
          hello
        {% endfilter %}
      `
    )
  })

  test('it should format autoescape with no strategy', async () => {
    const result = await format(
      heredoc`
        {% autoescape %}
          {{ user.name }}
        {% endautoescape %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% autoescape %}
          {{ user.name }}
        {% endautoescape %}
      `
    )
  })

  test('it should format autoescape with a boolean strategy', async () => {
    const result = await format(
      heredoc`
        {% autoescape true %}
          {{ user.name }}
        {% endautoescape %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% autoescape true %}
          {{ user.name }}
        {% endautoescape %}
      `
    )
  })

  test('it should format autoescape with a string strategy', async () => {
    const result = await format(
      heredoc`
        {% autoescape 'html' %}
          {{ user.name }}
        {% endautoescape %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% autoescape 'html' %}
          {{ user.name }}
        {% endautoescape %}
      `
    )
  })

  test('it should format guard and preserve sibling content after it closes', async () => {
    const result = await format(
      heredoc`
        {% guard function myFunc %}
          fallback content
        {% endguard %}
        after
      `
    )

    expect(result).toBe(
      heredoc`
        {% guard function myFunc %}
          fallback content
        {% endguard %}
        after
      `
    )
  })
})
