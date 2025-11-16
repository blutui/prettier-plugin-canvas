import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Extends', () => {
  test('it should never break a name', async () => {
    const result = await format(
      heredoc`
        {% extends  "base.canvas" %}
        {% extends "base.canvas" %}
        {%extends "base.canvas"%}
        {%- extends
        "base.canvas"
        -%}
        {%- extends none -%}
      `,
      { printWidth: 1 }
    )

    expect(result).toBe(
      heredoc`
        {% extends "base.canvas" %}
        {% extends "base.canvas" %}
        {% extends "base.canvas" %}
        {%- extends "base.canvas" -%}
        {%- extends none -%}
      `
    )
  })

  test('it correctly formats a child template', async () => {
    const result = await format(
      heredoc`
        {% extends  "base.canvas" %}

        {% block title %}Index{% endblock %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% extends "base.canvas" %}

        {% block title %}Index{% endblock %}
      `
    )
  })

  test('issue #16', async () => {
    const result = await format(
      heredoc`
        {% extends 'components/layouts/default' %}

        {% set contact = cms.collection('contact') %}

        {% block styles %}{% endblock %}
        {% block body %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% extends 'components/layouts/default' %}

        {% set contact = cms.collection('contact') %}

        {% block styles %}{% endblock %}
        {% block body %}
      `
    )
  })
})
