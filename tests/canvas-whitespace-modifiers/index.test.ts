import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Whitespace Modifiers', () => {
  test('it should preserve ~ on both sides of an output', async () => {
    const result = await format(
      heredoc`
        {{~ name ~}}
      `
    )

    expect(result).toBe(
      heredoc`
        {{~ name ~}}
      `
    )
  })

  test('it should preserve ~ on the left side of an output', async () => {
    const result = await format(
      heredoc`
        {{~ name }}
      `
    )

    expect(result).toBe(
      heredoc`
        {{~ name }}
      `
    )
  })

  test('it should preserve ~ on the right side of an output', async () => {
    const result = await format(
      heredoc`
        {{ name ~}}
      `
    )

    expect(result).toBe(
      heredoc`
        {{ name ~}}
      `
    )
  })

  test('it should preserve ~ on a tag and its closing tag', async () => {
    const result = await format(
      heredoc`
        {%~ if a ~%}x{%~ endif ~%}
      `
    )

    expect(result).toBe(
      heredoc`
        {%~ if a ~%}x{%~ endif ~%}
      `
    )
  })

  test('it should not swap - for ~ when both are mixed', async () => {
    const result = await format(
      heredoc`
        {%- if a ~%}x{%~ endif -%}
      `
    )

    expect(result).toBe(
      heredoc`
        {%- if a ~%}x{%~ endif -%}
      `
    )
  })

  test('it should still preserve the - modifier', async () => {
    const result = await format(
      heredoc`
        {{- name -}}
      `
    )

    expect(result).toBe(
      heredoc`
        {{- name -}}
      `
    )
  })

  test('it should round trip the whitespace control example from the docs', async () => {
    const source = heredoc`
      {% set value = 'no spaces' %}
      {#- No leading/trailing whitespace -#}
      {%- if true -%}
        {{- value -}}
      {%- endif -%}
    `
    const result = await format(source)

    expect(result).toBe(source)
    expect(await format(result)).toBe(result)
  })
})
