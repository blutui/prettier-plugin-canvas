import { describe, expect, test } from 'vitest'
import { format, heredoc } from 'tests/utils'

describe('HTML Comments', () => {
  test('it should handle the css display of the next node', async () => {
    const result = await format(
      heredoc`
        <!-- display: block -->
        <span>{{ hi }}</span>
      `,
      { printWidth: 1 }
    )

    expect(result).toBe(
      heredoc`
        <!-- display: block -->
        <span>
          {{ hi }}
        </span>
      `
    )
  })

  test('it should preserve MSO conditional comments', async () => {
    const result = await format(
      heredoc`
        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="570" align="center">
        <![endif]-->
      `
    )

    expect(result).toBe(
      heredoc`
        <!--[if mso]>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="570" align="center">
        <![endif]-->
      `
    )
  })

  test('it should support the IE comment `&` operators', async () => {
    const result = await format(
      heredoc`
        <!--[if (gt IE 5)&(lt IE 7)]>
        <script src="script.js></script>
        <script>
          form('#contact');
        </script>
        <![endif]-->
      `
    )

    expect(result).toBe(
      heredoc`
        <!--[if (gt IE 5)&(lt IE 7)]>
          <script src="script.js></script>
          <script>
            form('#contact');
          </script>
        <![endif]-->
      `
    )
  })

  test('it should support the IE comment `|` operators', async () => {
    const result = await format(
      heredoc`
        <!--[if (IE 6)|(IE 7)]>
        <style type="text/css">
        a { color:#fff; }
        </style>
        <![endif]-->
      `
    )

    expect(result).toBe(
      heredoc`
        <!--[if (IE 6)|(IE 7)]>
          <style type="text/css">
          a { color:#fff; }
          </style>
        <![endif]-->
      `
    )
  })
})
