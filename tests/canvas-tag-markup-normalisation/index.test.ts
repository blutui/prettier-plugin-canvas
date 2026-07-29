import { describe, expect, test } from 'vitest'

import { format } from 'tests/utils'

/**
 * Every block tag parses its markup into an expression tree and prints it back
 * from there, so spacing and separators come out the same regardless of how the
 * source was written. None of these rewrites may change what the template
 * renders — see the quote and hash-key cases in particular.
 */
describe('Canvas Tag: Markup Normalisation', () => {
  const cases: [string, string][] = [
    // embed reuses the include markup
    [`{% embed "b.html" %}x{% endembed %}`, `{% embed 'b.html' %}x{% endembed %}`],
    [
      `{% embed "b.html"   with   {'foo':'bar'} %}x{% endembed %}`,
      `{% embed 'b.html' with { 'foo': 'bar' } %}x{% endembed %}`,
    ],
    [
      `{% embed 'b.html' ignore missing only %}x{% endembed %}`,
      `{% embed 'b.html' ignore missing only %}x{% endembed %}`,
    ],

    // for — note `for` always breaks its body
    [
      `{% for key,user in users %}x{% endfor %}`,
      `{% for key, user in users -%}\n  x\n{%- endfor %}`,
    ],
    [`{% for i in 0..10 %}x{% endfor %}`, `{% for i in 0..10 -%}\n  x\n{%- endfor %}`],
    [`{% for i in (0..10) %}x{% endfor %}`, `{% for i in (0..10) -%}\n  x\n{%- endfor %}`],

    // apply / filter
    [`{% apply upper|escape %}x{% endapply %}`, `{% apply upper | escape %}x{% endapply %}`],
    [`{% filter upper|escape %}x{% endfilter %}`, `{% filter upper | escape %}x{% endfilter %}`],

    // autoescape
    [`{% autoescape %}x{% endautoescape %}`, `{% autoescape %}x{% endautoescape %}`],
    [`{% autoescape 'html' %}x{% endautoescape %}`, `{% autoescape 'html' %}x{% endautoescape %}`],
    [`{% autoescape false %}x{% endautoescape %}`, `{% autoescape false %}x{% endautoescape %}`],

    // with
    [`{% with %}x{% endwith %}`, `{% with %}x{% endwith %}`],
    [`{% with {foo:42} %}x{% endwith %}`, `{% with { foo: 42 } %}x{% endwith %}`],
    [`{% with {foo:42} only %}x{% endwith %}`, `{% with { foo: 42 } only %}x{% endwith %}`],

    // form
    [
      `{% form 'contact' with {id:'contact'} %}x{% endform %}`,
      `{% form 'contact' with { id: 'contact' } %}x{% endform %}`,
    ],

    // macro
    [
      `{% macro input(name,value,type='text',size=20) %}x{% endmacro %}`,
      `{% macro input(name, value, type = 'text', size = 20) %}x{% endmacro %}`,
    ],
    [`{% macro input() %}x{% endmacro %}`, `{% macro input() %}x{% endmacro %}`],

    // block, including the shortcut form
    [`{% block title %}x{% endblock %}`, `{% block title %}x{% endblock %}`],
    [`{% block title page_title|title %}`, `{% block title page_title | title %}`],

    // guard
    [`{% guard function myFunc %}x{% endguard %}`, `{% guard function myFunc %}x{% endguard %}`],
  ]

  for (const [source, expected] of cases) {
    test(`it should format ${source}`, async () => {
      const result = await format(source)

      expect(result).toBe(`${expected}\n`)
      // Formatting must be stable.
      expect(await format(result)).toBe(result)
    })
  }

  test('it should not strip quotes from hash keys that need them', async () => {
    const result = await format(`{% with {'data-id':1,'foo bar':2} %}x{% endwith %}`)

    expect(result).toBe(`{% with { 'data-id': 1, 'foo bar': 2 } %}x{% endwith %}\n`)
  })

  test('it should keep double quotes when a string interpolates', async () => {
    const result = await format(`{% embed "tpl-#{name}.html" %}x{% endembed %}`)

    expect(result).toBe(`{% embed "tpl-#{name}.html" %}x{% endembed %}\n`)
  })
})
