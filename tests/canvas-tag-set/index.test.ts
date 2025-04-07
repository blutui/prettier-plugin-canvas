import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Canvas Tag: Set', () => {
  test('it should never break a name', async () => {
    const result = await format(
      heredoc`
        {% set z = x %}
      `,
      {
        printWidth: 1,
      }
    )

    expect(result).toBe(
      heredoc`
        {% set z = x %}
      `
    )
  })

  test('it should break before/after delimiters and indent everything', async () => {
    const result = await format(
      heredoc`
        {% set z = x | filter1 | filter2 %}
      `,
      {
        printWidth: 1,
      }
    )

    expect(result).toBe(
      heredoc`
        {% set z = x
          | filter1
          | filter2
        %}
      `
    )
  })

  test('it should break and indent named arguments', async () => {
    const result = await format(
      heredoc`
        {% set z = x | filter1(key1 = value1, key2= value2) | filter2 %}
      `,
      {
        printWidth: 1,
      }
    )

    expect(result).toBe(
      heredoc`
        {% set z = x
          | filter1(
              key1: value1,
              key2: value2
            )
          | filter2
        %}
      `
    )
  })

  test('it should break and indent named arguments using a tabWidth of 4', async () => {
    const result = await format(
      heredoc`
        {% set z = x | filter1(key1 = value1, key2= value2) | filter2 %}
      `,
      {
        printWidth: 1,
        tabWidth: 4,
      }
    )

    expect(result).toBe(
      heredoc`
        {% set z = x
            | filter1(
                  key1: value1,
                  key2: value2
              )
            | filter2
        %}
      `
    )
  })

  test('it should break positional arguments', async () => {
    const result = await format(
      heredoc`
        {% set z = x | filter1(arg1) | filter2(arg2, arg3, arg4) %}
      `,
      {
        printWidth: 1,
      }
    )

    expect(result).toBe(
      heredoc`
        {% set z = x
          | filter1(
              arg1
            )
          | filter2(
              arg2,
              arg3,
              arg4
            )
        %}
      `
    )
  })

  test('it should break arguments only if necessary', async () => {
    const result = await format(
      heredoc`
        {% set z = x | filter1(key1 = value1, key2= value2) | filter2 %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% set z = x | filter1(key1: value1, key2: value2) | filter2 %}
      `
    )
  })

  test('it should support a mix of positional and named arguments as expected', async () => {
    const result = await format(
      heredoc`
        {% set z = x | filter1(pos1, pos2, key1= val1, key2= val2) %}
      `,
      {
        printWidth: 1,
      }
    )

    expect(result).toBe(
      heredoc`
        {% set z = x
          | filter1(
              pos1,
              pos2,
              key1: val1,
              key2: val2
            )
        %}
      `
    )
  })

  test('it should support all types of arguments, and add spaces', async () => {
    const result = await format(
      heredoc`
        {% set z=x|f('string') %}
        {% set z=x|f("string") %}
        {% set z=x|f(0.0) %}
        {% set z=x|f(0) %}
        {% set z=x|f(x) %}
        {% set z=x|f(true) %}
      `
    )

    expect(result).toBe(
      heredoc`
        {% set z = x | f('string') %}
        {% set z = x | f('string') %}
        {% set z = x | f(0.0) %}
        {% set z = x | f(0) %}
        {% set z = x | f(x) %}
        {% set z = x | f(true) %}
      `
    )
  })
})
