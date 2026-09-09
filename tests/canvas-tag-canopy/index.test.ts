import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Canopy', () => {
  test('it should format the config section as JSON', async () => {
    const result = await format(
      heredoc`
        {% canopy config %}
        {"title":"Hero","name":"hero","settings":[{"name":"heading","type":"heading","default":{"value":"Welcome to our site","element":"h1"}}]}
        {% endcanopy %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% canopy config %}
        {
          "title": "Hero",
          "name": "hero",
          "settings": [
            {
              "name": "heading",
              "type": "heading",
              "default": { "value": "Welcome to our site", "element": "h1" }
            }
          ]
        }
        {% endcanopy %}
      `
    )
  })

  test('it should format the template section as Canvas/HTML', async () => {
    const result = await format(
      heredoc`
        {% canopy template %}
        <section class="hero">
        <h1>{{ settings.heading.value }}</h1>
        {% if settings.cta.url %}
        <a href="{{ settings.cta.url }}" target="{{ settings.cta.target }}">{{ settings.cta.text }}</a>
        {% endif %}
        </section>
        {% endcanopy %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% canopy template %}
        <section class="hero">
          <h1>{{ settings.heading.value }}</h1>
          {% if settings.cta.url %}
            <a href="{{ settings.cta.url }}" target="{{ settings.cta.target }}">
              {{- settings.cta.text -}}
            </a>
          {% endif %}
        </section>
        {% endcanopy %}
      `
    )
  })

  test('it should format the head and scripts sections, embedding nested style/script tags', async () => {
    const result = await format(
      heredoc`
        {% canopy head %}
        <link rel="stylesheet" href="/css/hero.css" />
        {% endcanopy %}

        {% canopy scripts %}
        <script src="/js/hero.js"></script>
        {% endcanopy %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% canopy head %}
        <link rel="stylesheet" href="/css/hero.css">
        {% endcanopy %}

        {% canopy scripts %}
        <script src="/js/hero.js"></script>
        {% endcanopy %}
      `
    )
  })

  test('it should format a full block template with all four sections', async () => {
    const result = await format(
      heredoc`
        {% canopy config %}
        {
            "title": "Hero",
            "name": "hero",
            "settings": [
                { "name": "heading", "type": "heading", "default": { "value": "Welcome to our site", "element": "h1" } },
                { "name": "description", "type": "textarea", "placeholder": "Add a short introduction..." },
                { "name": "cta", "type": "url", "label": "Call to action" }
            ]
        }
        {% endcanopy %}

        {% canopy template %}
        <section class="mx-auto max-w-7xl px-6 py-20">
          <{{ settings.heading.element }}>{{ settings.heading.value }}</{{ settings.heading.element }}>
          <p>{{ settings.description }}</p>
          {% if settings.cta.url %}
            <a href="{{ settings.cta.url }}" target="{{ settings.cta.target }}">{{ settings.cta.text }}</a>
          {% endif %}
        </section>
        {% endcanopy %}

        {% canopy head %}
        <link rel="stylesheet" href="/css/hero.css" />
        {% endcanopy %}

        {% canopy scripts %}
        <script src="/js/hero.js"></script>
        {% endcanopy %}
      `
    )

    // Formatting should be stable (idempotent).
    const reformatted = await format(result)
    expect(reformatted).toBe(result)
  })

  test('it should leave an unknown canopy section as untouched raw content', async () => {
    const result = await format(
      heredoc`
        {% canopy mystery %}
        whatever this is
        {% endcanopy %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% canopy mystery %}
          whatever this is
        {% endcanopy %}
      `
    )
  })

  test('it should preserve whitespace trimming on the closing tag', async () => {
    const result = await format(
      heredoc`
        {% canopy config %}
        {"a":1}
        {%- endcanopy -%}
      `
    )

    expect(result).toBe(
      heredoc`
        {% canopy config %}
        { "a": 1 }
        {%- endcanopy -%}
      `
    )
  })

  test('it should indent the section body when the tag is nested in markup', async () => {
    const result = await format(
      heredoc`
        <div>
        {% canopy template %}
        <p>x</p>
        {% endcanopy %}
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div>
          {% canopy template %}
            <p>x</p>
          {% endcanopy %}
        </div>
      `
    )
  })

  test('it should drop a section name repeated on the closing tag', async () => {
    const result = await format(
      heredoc`
        {% canopy config %}
        {"a":1}
        {% endcanopy config %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% canopy config %}
        { "a": 1 }
        {% endcanopy %}
      `
    )
  })
})
