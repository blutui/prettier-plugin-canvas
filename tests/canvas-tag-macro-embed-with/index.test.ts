import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: macro/embed/with', () => {
  test('it should indent macro bodies like other block tags', async () => {
    const result = await format(
      heredoc`
        {% macro input(name, value, type = 'text', size = 20) %}
          <input type="{{ type }}" name="{{ name }}" value="{{ value|e }}" size="{{ size }}" />
        {% endmacro %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% macro input(name, value, type = 'text', size = 20) %}
          <input
            type="{{ type }}"
            name="{{ name }}"
            value="{{ value|e }}"
            size="{{ size }}"
          >
        {% endmacro %}
      `
    )
  })

  test('it should support macro definitions nested inside a block', async () => {
    const src = heredoc`
      {% block forms %}
        {% macro greeting(name) %}
          Hello {{ name }}
        {% endmacro %}
      {% endblock %}
    `
    const result = await format(src)
    const reformatted = await format(result)
    expect(reformatted).toBe(result)
    expect(result).toBe(
      heredoc`
        {% block forms %}
          {% macro greeting(name) %}
            Hello
            {{ name }}
          {% endmacro %}
        {% endblock %}
      `
    )
  })

  test('it should indent embed bodies and their nested block overrides', async () => {
    const result = await format(
      heredoc`
        {% embed 'teasers_skeleton.html' %}
          {% block left_teaser %}
            Some content for the left teaser box
          {% endblock %}
        {% endembed %}
        after
      `
    )

    expect(result).toBe(
      heredoc`
        {% embed 'teasers_skeleton.html' %}
          {% block left_teaser %}
            Some content for the left teaser box
          {% endblock %}
        {% endembed %}
        after
      `
    )
  })

  test('it should indent with bodies', async () => {
    const result = await format(
      heredoc`
        {% with { foo: 42 } only %}
          {{ foo }}
        {% endwith %}
        after
      `
    )

    expect(result).toBe(
      heredoc`
        {% with { foo: 42 } only %}
          {{ foo }}
        {% endwith %}
        after
      `
    )
  })

  test('it should format use, from, import, and deprecated as single-line tags', async () => {
    const result = await format(
      heredoc`
        {% extends 'base.html' %}
        {% use 'blocks.html' with sidebar as base_sidebar, title as base_title %}
        {% import 'forms.html' as forms %}
        {% from 'forms.html' import input as input, textarea %}
        {% deprecated 'The "base.html" template is deprecated, use "layout.html" instead.' %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% extends 'base.html' %}
        {% use 'blocks.html' with sidebar as base_sidebar, title as base_title %}
        {% import 'forms.html' as forms %}
        {% from 'forms.html' import input as input, textarea %}
        {% deprecated 'The "base.html" template is deprecated, use "layout.html" instead.' %}
      `
    )
  })
})
