import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

/**
 * Conditions are the markup of `{% if %}` / `{% elseif %}`. Anything that
 * changes here changes what the template renders, so every case asserts an
 * exact round trip.
 */
describe('Canvas Conditions', () => {
  const roundTrips = [
    // bare lookups
    '{% if a %}x{% endif %}',
    '{% if a.b.c %}x{% endif %}',
    // comparisons
    '{% if a == 1 %}x{% endif %}',
    '{% if a != 1 %}x{% endif %}',
    '{% if a <=> b %}x{% endif %}',
    // logical chains
    '{% if a and b %}x{% endif %}',
    '{% if a or b %}x{% endif %}',
    '{% if a and b and c %}x{% endif %}',
    '{% if a == 1 and b == 2 %}x{% endif %}',
    // containment
    '{% if a in b %}x{% endif %}',
    '{% if a not in b %}x{% endif %}',
    // tests
    '{% if a is defined %}x{% endif %}',
    '{% if a is not defined %}x{% endif %}',
    '{% if a is empty %}x{% endif %}',
    '{% if a is iterable %}x{% endif %}',
    '{% if a is null %}x{% endif %}',
    '{% if a.b.c is not empty %}x{% endif %}',
    '{% if a is even and b is odd %}x{% endif %}',
    // tests taking arguments
    '{% if n is divisible by(3) %}x{% endif %}',
    '{% if n is not divisible by(3) %}x{% endif %}',
    '{% if a is same as(b) %}x{% endif %}',
    "{% if a is constant('X') %}x{% endif %}",
  ]

  for (const source of roundTrips) {
    test(`it should round trip ${source}`, async () => {
      const result = await format(source)

      expect(result).toBe(`${source}\n`)
    })
  }

  test('it should not drop a leading not', async () => {
    const result = await format(
      heredoc`
        {% if not a %}
        x
        {% endif %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% if not a %}
          x
        {% endif %}
      `
    )
  })

  test('it should print logical expressions rather than dropping them', async () => {
    const result = await format(
      heredoc`
        {% if user.isActive and user.hasSubscription %}
        x
        {% endif %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% if user.isActive and user.hasSubscription %}
          x
        {% endif %}
      `
    )
  })
})
